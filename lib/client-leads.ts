import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Tenant } from "./tenants";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "offer_sent"
  | "under_contract"
  | "closed"
  | "dead";

export const STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "offer_sent",
  "under_contract",
  "closed",
  "dead",
];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  offer_sent: "Offer Sent",
  under_contract: "Under Contract",
  closed: "Closed",
  dead: "Dead",
};

export const STATUS_COLOR: Record<LeadStatus, string> = {
  new: "#0EA5E9",
  contacted: "#8B5CF6",
  qualified: "#F59E0B",
  offer_sent: "#F97316",
  under_contract: "#10B981",
  closed: "#059669",
  dead: "#9CA3AF",
};

export interface LeadRow {
  id: string;
  created_at: string;
  updated_at: string;
  source: string;
  source_detail: string | null;
  status: LeadStatus;
  name: string;
  phone: string;
  email: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  motivation: string | null;
  asking_price: number | null;
  arv: number | null;
  repair_estimate: number | null;
  our_offer: number | null;
  notes: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  assigned_to: string | null;
}

export interface ActivityRow {
  id: string;
  lead_id: string;
  created_at: string;
  type: string;
  author: string | null;
  content: string | null;
  meta: Record<string, unknown> | null;
}

const cache = new Map<string, SupabaseClient>();

function tenantClient(tenant: Tenant): SupabaseClient | null {
  const key = process.env[tenant.supabaseServiceRoleKeyEnv]?.trim();
  if (!key) return null;
  if (cache.has(tenant.slug)) return cache.get(tenant.slug)!;
  const sb = createClient(tenant.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cache.set(tenant.slug, sb);
  return sb;
}

export interface LeadsResult {
  leads: LeadRow[];
  isSample: boolean;
}

export async function fetchTenantLeads(tenant: Tenant): Promise<LeadsResult> {
  const sb = tenantClient(tenant);
  if (!sb) return { leads: SAMPLE_LEADS, isSample: true };

  try {
    const { data, error } = await sb
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return { leads: ((data ?? []) as LeadRow[]), isSample: false };
  } catch (e) {
    console.warn(`[tenant-leads:${tenant.slug}] fetchTenantLeads failed:`, e);
    return { leads: SAMPLE_LEADS, isSample: true };
  }
}

export interface LeadDetailResult {
  lead: LeadRow | null;
  activity: ActivityRow[];
  isSample: boolean;
}

export async function fetchTenantLeadDetail(
  tenant: Tenant,
  id: string,
): Promise<LeadDetailResult> {
  const sb = tenantClient(tenant);
  if (!sb || id.startsWith("sample-")) {
    const lead = SAMPLE_LEADS.find((l) => l.id === id) || null;
    return {
      lead,
      activity: lead
        ? [
            {
              id: "a-1",
              lead_id: lead.id,
              created_at: lead.created_at,
              type: "lead_created",
              author: "system",
              content: `Lead created from ${lead.source}`,
              meta: { source: lead.source },
            },
          ]
        : [],
      isSample: true,
    };
  }

  try {
    const [leadQ, actQ] = await Promise.all([
      sb.from("leads").select("*").eq("id", id).maybeSingle(),
      sb.from("activity").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    ]);
    if (leadQ.error) throw leadQ.error;
    if (actQ.error) throw actQ.error;
    return {
      lead: (leadQ.data as LeadRow | null) ?? null,
      activity: ((actQ.data ?? []) as ActivityRow[]),
      isSample: false,
    };
  } catch (e) {
    console.warn(`[tenant-leads:${tenant.slug}] fetchTenantLeadDetail failed:`, e);
    return { lead: null, activity: [], isSample: false };
  }
}

export async function updateTenantLeadStatus(
  tenant: Tenant,
  id: string,
  status: LeadStatus,
): Promise<void> {
  const sb = tenantClient(tenant);
  if (!sb || id.startsWith("sample-")) return;
  const { error } = await sb.from("leads").update({ status }).eq("id", id);
  if (error) throw error;
  await sb.from("activity").insert({
    lead_id: id,
    type: "status_change",
    author: "portal",
    content: `Status changed to ${status}`,
    meta: { status },
  });
}

export async function addTenantNote(
  tenant: Tenant,
  id: string,
  note: string,
): Promise<void> {
  const sb = tenantClient(tenant);
  if (!sb || id.startsWith("sample-")) return;
  const { error } = await sb.from("activity").insert({
    lead_id: id,
    type: "note",
    author: "portal",
    content: note,
  });
  if (error) throw error;
}

export interface CallIngestInput {
  callerName?: string;
  phone: string;
  summary?: string;
  transcript?: string;
  recordingUrl?: string;
  duration?: number;
  agentId?: string;
  callId?: string;
  direction: "inbound" | "outbound";
  metadata?: Record<string, unknown>;
}

export interface CallIngestResult {
  ok: boolean;
  leadId: string | null;
  wasNew: boolean;
  reason?: string;
}

/**
 * Upsert a lead from a Trillet call event and append a call activity row
 * to the lead's timeline. Uses the existing `upsert_lead` RPC for idempotent
 * dedupe-by-phone, then adds a call_inbound / call_outbound activity record.
 */
export async function ingestCall(
  tenant: Tenant,
  input: CallIngestInput,
): Promise<CallIngestResult> {
  const sb = tenantClient(tenant);
  if (!sb) return { ok: false, leadId: null, wasNew: false, reason: "tenant-supabase-not-configured" };

  const phone = input.phone?.trim();
  if (!phone) return { ok: false, leadId: null, wasNew: false, reason: "no-phone" };

  const sourceDetail = input.agentId ? `trillet:${input.agentId}` : "trillet";

  // 1. Upsert the lead (creates if new, returns existing if phone already in DB)
  let leadId: string | null = null;
  let wasNew = false;
  try {
    const { data, error } = await sb.rpc("upsert_lead", {
      p_source: input.direction === "outbound" ? "phone" : "phone",
      p_name: input.callerName || "Unknown caller",
      p_phone: phone,
      p_email: null,
      p_address: null,
      p_city: null,
      p_state: null,
      p_zip: null,
      p_source_detail: sourceDetail,
      p_raw_payload: {
        call_id: input.callId,
        agent_id: input.agentId,
        recording_url: input.recordingUrl,
        duration: input.duration,
        metadata: input.metadata ?? {},
      },
    });
    if (error) throw error;
    if (Array.isArray(data) && data.length > 0) {
      const row = data[0] as { lead_id: string; was_new: boolean };
      leadId = row.lead_id;
      wasNew = row.was_new;
    }
  } catch (e) {
    return { ok: false, leadId: null, wasNew: false, reason: (e as Error).message };
  }

  if (!leadId) return { ok: false, leadId: null, wasNew, reason: "no-lead-id-returned" };

  // 2. Insert a call activity row with the summary + transcript.
  const activityType = input.direction === "outbound" ? "call_outbound" : "call_inbound";
  const lines: string[] = [];
  if (input.summary) lines.push(`Summary: ${input.summary}`);
  if (typeof input.duration === "number") lines.push(`Duration: ${input.duration}s`);
  if (input.recordingUrl) lines.push(`Recording: ${input.recordingUrl}`);
  if (input.transcript) lines.push("", "Transcript:", input.transcript);
  const content = lines.join("\n");

  try {
    await sb.from("activity").insert({
      lead_id: leadId,
      type: activityType,
      author: "trillet",
      content,
      meta: {
        call_id: input.callId,
        agent_id: input.agentId,
        recording_url: input.recordingUrl,
        duration: input.duration,
        direction: input.direction,
      },
    });
  } catch (e) {
    return { ok: true, leadId, wasNew, reason: `activity-insert-failed: ${(e as Error).message}` };
  }

  // 3. Bump last_contacted_at so the lead surfaces in "recent activity" views.
  try {
    await sb.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", leadId);
  } catch {
    // non-fatal
  }

  return { ok: true, leadId, wasNew };
}

export function formatTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length !== 10) return phone;
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

export function formatMoney(n: number | null): string {
  if (n == null) return "—";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

const SAMPLE_LEADS: LeadRow[] = [
  {
    id: "sample-1",
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    source: "phone", source_detail: "trillet:jaz", status: "new",
    name: "Lacey Whitfield", phone: "+15735552134", email: null,
    property_address: "1428 Range Line St", property_city: "Columbia",
    property_state: "MO", property_zip: "65201",
    motivation: "Inherited from mom — out of state",
    asking_price: null, arv: null, repair_estimate: null, our_offer: null,
    notes: "", last_contacted_at: null, next_follow_up_at: null, assigned_to: null,
  },
  {
    id: "sample-2",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    source: "web", source_detail: "google:gbp", status: "contacted",
    name: "Marcus Reed", phone: "+15735557831", email: "marcus@example.com",
    property_address: "907 Madison St", property_city: "Jefferson City",
    property_state: "MO", property_zip: "65101",
    motivation: "Tired landlord — bad tenant",
    asking_price: 165000, arv: 198000, repair_estimate: 28000, our_offer: null,
    notes: "Will text photos this evening.",
    last_contacted_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    next_follow_up_at: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    assigned_to: "brayden@nextlevelacq.com",
  },
  {
    id: "sample-3",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    source: "direct_mail", source_detail: null, status: "qualified",
    name: "Diane Foster", phone: "+15735554412", email: null,
    property_address: "318 W Boulevard", property_city: "Columbia",
    property_state: "MO", property_zip: "65203",
    motivation: "Foreclosure — auction in 12 days",
    asking_price: null, arv: 142000, repair_estimate: 22000, our_offer: null,
    notes: "Wants to meet Friday 4pm. Hot — auction date.",
    last_contacted_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    next_follow_up_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    assigned_to: "brayden@nextlevelacq.com",
  },
  {
    id: "sample-4",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    source: "phone", source_detail: "trillet:jaz", status: "offer_sent",
    name: "Carl Whitman", phone: "+15735559002", email: "cwhitman@example.com",
    property_address: "412 Cherry St", property_city: "Boonville",
    property_state: "MO", property_zip: "65233",
    motivation: "Divorce sale",
    asking_price: 89000, arv: 118000, repair_estimate: 15000, our_offer: 72000,
    notes: "Offer sent. Waiting on signature.",
    last_contacted_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    next_follow_up_at: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    assigned_to: "brayden@nextlevelacq.com",
  },
  {
    id: "sample-5",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    source: "web", source_detail: "facebook:lead-form", status: "under_contract",
    name: "Rita Holmes", phone: "+15735551122", email: null,
    property_address: "2207 Smiley Ln", property_city: "Columbia",
    property_state: "MO", property_zip: "65202",
    motivation: "Behind on payments",
    asking_price: 110000, arv: 148000, repair_estimate: 18000, our_offer: 92000,
    notes: "Closing scheduled for next Thursday.",
    last_contacted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    next_follow_up_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
    assigned_to: "brayden@nextlevelacq.com",
  },
  {
    id: "sample-6",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    source: "referral", source_detail: null, status: "closed",
    name: "Glen Patterson", phone: "+15735556677", email: null,
    property_address: "603 Park Ave", property_city: "Fulton",
    property_state: "MO", property_zip: "65251",
    motivation: "Vacant",
    asking_price: 64000, arv: 98000, repair_estimate: 32000, our_offer: 48000,
    notes: "Closed. Under rehab.",
    last_contacted_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    next_follow_up_at: null,
    assigned_to: "brayden@nextlevelacq.com",
  },
];
