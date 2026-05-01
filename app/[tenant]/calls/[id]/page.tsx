import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { findTenant } from "@/lib/tenants";
import { getCall } from "@/lib/trillet";
import { getNote } from "@/lib/notes";
import { formatDateTime, formatDuration, formatPhone, statusColor } from "@/lib/format";
import TenantNotesForm from "./notes-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TenantCallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string; id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tenant: slug, id } = await params;
  const sp = await searchParams;

  const tenant = findTenant(slug);
  if (!tenant) notFound();

  const agentId = tenant.trilletAgentId;
  if (!agentId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
          Set <code>{slug.toUpperCase()}_TRILLET_AGENT_ID</code> in Vercel to view this call.
        </div>
      </div>
    );
  }

  const [call, existingNote] = await Promise.all([
    getCall(agentId, id),
    getNote(session.userId, id),
  ]);
  if (!call) notFound();

  const fromRaw = call.from || "";
  const telDigits = fromRaw.replace(/[^\d+]/g, "");
  const telHref = telDigits ? `tel:${telDigits.startsWith("+") ? telDigits : `+${telDigits}`}` : "";
  const smsHref = telDigits ? `sms:${telDigits.startsWith("+") ? telDigits : `+${telDigits}`}` : "";
  const vcardHref = buildVcardHref(call);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <Link
        href={`/${tenant.slug}/calls`}
        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
      >
        ← All calls
      </Link>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {call.direction || "call"} · {formatDateTime(call.startedAt)}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              {formatPhone(call.from) || "Unknown"}
            </h1>
            <div className="text-sm text-neutral-600">to {formatPhone(call.to)}</div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusColor(call.status)}`}
          >
            {call.status || "—"}
          </span>
        </div>

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          {telHref && (
            <a
              href={telHref}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white shadow"
              style={{ background: tenant.brand }}
            >
              📞 Call back {formatPhone(fromRaw)}
            </a>
          )}
          {smsHref && (
            <a
              href={smsHref}
              className="rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-bold"
            >
              💬 Text
            </a>
          )}
          <a
            href={vcardHref}
            download={`contact-${safeName(fromRaw)}.vcf`}
            className="rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-bold"
          >
            💾 Save contact
          </a>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Duration" value={formatDuration(call.duration)} />
          <Stat label="Agent" value={call.agentName || call.flowName || "—"} />
        </div>

        {/* Recording */}
        {call.recordId && (
          <div className="mt-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Recording
            </div>
            <audio
              controls
              preload="none"
              src={`/api/recording/${encodeURIComponent(call.recordId)}?agentId=${encodeURIComponent(agentId)}`}
              className="w-full"
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {/* Summary */}
        {call.summary && (
          <div className="mt-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Summary
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed">
              {call.summary}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Your notes
          </div>
          <TenantNotesForm
            callId={id}
            initialNotes={existingNote}
            saved={sp.saved === "1"}
            brand={tenant.brand}
          />
        </div>

        {/* Transcript */}
        {call.transcript && call.transcript.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Transcript
            </div>
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              {call.transcript.map((line, i) => {
                const isAgent = /agent|assistant|ai|jaz|gia|charlotte|karen/i.test(line.role);
                return (
                  <div key={i} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        isAgent
                          ? "bg-white border border-neutral-200 text-neutral-900"
                          : "text-white"
                      }`}
                      style={!isAgent ? { background: tenant.brand } : undefined}
                    >
                      <div
                        className={`text-[10px] font-semibold uppercase tracking-wider ${isAgent ? "text-neutral-500" : "text-white/80"}`}
                      >
                        {line.role}
                      </div>
                      <div>{line.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!call.transcript?.length && call.analyzed && (
          <div className="mt-6">
            <details className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Post-call analysis
              </summary>
              <pre className="mt-3 overflow-x-auto text-xs text-neutral-700">
                {JSON.stringify(call.analyzed, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

function safeName(phone: string): string {
  return (phone || "caller").replace(/[^\d+]/g, "");
}

function buildVcardHref(call: {
  from?: string;
  to?: string;
  startedAt?: string;
  flowName?: string;
}): string {
  const phone = (call.from || "").replace(/[^\d+]/g, "") || "unknown";
  const telPretty = phone.startsWith("+") ? phone : `+${phone}`;
  const name = `Caller ${phone}`;
  const dateLabel = call.startedAt ? new Date(call.startedAt).toLocaleString() : "";
  const note = `Call to ${call.flowName || "AllTheCalls agent"}${dateLabel ? " on " + dateLabel : ""}`;
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `N:${phone};Caller;;;`,
    `TEL;TYPE=CELL,VOICE:${telPretty}`,
    `NOTE:${note}`,
    "END:VCARD",
  ].join("\n");
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;
}
