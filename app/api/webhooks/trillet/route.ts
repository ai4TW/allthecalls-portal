/**
 * POST /api/webhooks/trillet
 *
 * Inbound webhook from Trillet — fires after every call event (started,
 * completed, failed). We care primarily about `call.completed` and
 * `call.failed` since those carry the transcript + summary.
 *
 * Routing the event to the right tenant:
 *   1. metadata.tenant_slug (most reliable — set by /api/outbound bridge)
 *   2. trilletAgentId field on the Tenant in lib/tenants.ts (set in env)
 *
 * For every matched event we upsert a lead in the tenant's Supabase
 * (dedupe by phone) and append a call_inbound / call_outbound activity row
 * with the summary + transcript on the lead's timeline.
 *
 * Auth: simple shared-secret query param `?secret=...` matched against
 * TRILLET_WEBHOOK_SECRET env var. Add the secret to the webhook URL in
 * Trillet's dashboard; rotate by changing the env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { findTenantByAgentId, findTenantByMetadata } from "@/lib/tenants";
import { ingestCall } from "@/lib/client-leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TrilletEvent {
  event?: string;
  data?: Record<string, unknown>;
}

function pick<T = string>(
  obj: Record<string, unknown> | undefined | null,
  keys: string[],
): T | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v as T;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  // ── Auth via shared-secret query param ─────────────────────────────────
  const expected = process.env.TRILLET_WEBHOOK_SECRET?.trim();
  if (expected) {
    const provided = new URL(req.url).searchParams.get("secret");
    if (provided !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  const rawBody = await req.text();
  let event: TrilletEvent & Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid JSON", preview: rawBody.slice(0, 300) },
      { status: 400 },
    );
  }

  // Trillet wraps payload in `data` for some events but not others — handle both.
  const payload =
    (event.data as Record<string, unknown>) ||
    (event as Record<string, unknown>);

  const eventType = (event.event as string | undefined) || pick(payload, ["event", "type"]) || "unknown";

  // Skip non-completion events for now — we only ingest calls that actually
  // happened. Add support for sms.* / agent.* later if needed.
  const COMPLETED_EVENTS = new Set(["call.completed", "call.failed"]);
  const isCompletion = COMPLETED_EVENTS.has(eventType) || pick(payload, ["status"]) === "completed";
  if (!isCompletion) {
    console.log("[trillet webhook] skipping event:", eventType);
    return NextResponse.json({ ok: true, skipped: eventType });
  }

  // ── Normalize fields (Trillet field naming has been inconsistent) ──────
  const phone = pick<string>(payload, [
    "callerNumber", "caller_number", "from", "phone", "phoneNumber", "to",
  ]);
  const callerName = pick<string>(payload, [
    "callerName", "caller_name", "name", "contactName",
  ]);
  const summary = pick<string>(payload, ["summary", "call_summary", "analysis"]);
  const transcript = pick<string>(payload, ["transcript", "call_transcript"]);
  const recordingUrl = pick<string>(payload, ["recordingUrl", "recording_url", "recording"]);
  const duration = pick<number>(payload, ["duration", "call_duration", "durationSeconds"]);
  const agentId = pick<string>(payload, ["agentId", "agent_id", "call_agent_id", "pathwayId"]);
  const callId = pick<string>(payload, ["callId", "call_id"]);
  const directionRaw = pick<string>(payload, ["direction", "call_direction"]);
  const direction: "inbound" | "outbound" =
    directionRaw && directionRaw.toLowerCase().startsWith("out") ? "outbound" : "inbound";

  const metadata = (payload.metadata as Record<string, string> | undefined) || {};
  const dynamicVars = (payload.dynamic_variables as Record<string, string> | undefined) || {};

  // If the AI captured a nicer name during the call, prefer that.
  const effectiveName =
    callerName ||
    [dynamicVars.first_name, dynamicVars.last_name].filter(Boolean).join(" ") ||
    undefined;

  // ── Route to tenant ────────────────────────────────────────────────────
  const tenant =
    findTenantByMetadata(metadata) ||
    (agentId ? findTenantByAgentId(agentId) : undefined);

  if (!tenant) {
    console.warn("[trillet webhook] no tenant matched", { agentId, metadata });
    return NextResponse.json({
      ok: true,
      skipped: "no-tenant-matched",
      hint: "Add the agentId to lib/tenants.ts (or set WBHC_TRILLET_AGENT_ID), or include metadata.tenant_slug in the outbound call",
      agentId,
      keys: Object.keys(payload),
    });
  }

  if (!phone) {
    return NextResponse.json({
      ok: true,
      skipped: "no-phone",
      tenant: tenant.slug,
      keys: Object.keys(payload),
    });
  }

  // ── Ingest into the tenant's Supabase ──────────────────────────────────
  const result = await ingestCall(tenant, {
    callerName: effectiveName,
    phone,
    summary,
    transcript,
    recordingUrl,
    duration,
    agentId,
    callId,
    direction,
    metadata: { ...metadata, dynamic_variables: dynamicVars },
  });

  if (!result.ok) {
    console.warn("[trillet webhook] ingest failed:", result.reason);
    return NextResponse.json(
      { ok: false, tenant: tenant.slug, reason: result.reason },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    tenant: tenant.slug,
    leadId: result.leadId,
    wasNew: result.wasNew,
    direction,
  });
}

// GET is handy for "is the endpoint up?" curl checks.
export function GET() {
  return NextResponse.json({ ok: true, service: "atc-portal/webhooks/trillet" });
}
