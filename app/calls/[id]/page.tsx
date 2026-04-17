import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCall } from "@/lib/trillet";
import { getNote } from "@/lib/notes";
import Nav from "@/components/Nav";
import NotesForm from "@/components/NotesForm";
import AutoRefresh from "@/components/AutoRefresh";
import { formatDateTime, formatDuration, formatPhone, statusColor } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const [call, existingNote] = await Promise.all([
    getCall(session.agentId, id),
    getNote(session.userId, id),
  ]);
  if (!call) notFound();

  const fromRaw = call.from || "";
  const telHref = buildTelHref(fromRaw);
  const vcardHref = buildVcardHref(call);

  return (
    <>
      <Nav session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/calls" className="inline-flex items-center gap-1 text-sm text-ink-dim hover:text-accent-cyan">
            ← All calls
          </Link>
          <AutoRefresh intervalMs={10000} />
        </div>

        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                {call.direction || "call"} · {formatDateTime(call.startedAt)}
              </div>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
                {formatPhone(call.from)}
              </h1>
              <div className="text-sm text-ink-dim">to {formatPhone(call.to)}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusColor(call.status)}`}>
              {call.status || "—"}
            </span>
          </div>

          {/* Quick actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            {telHref && (
              <a
                href={telHref}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-90 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#10b981 0%,#059669 100%)" }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.3a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-1.7.85a11 11 0 005.52 5.52l.85-1.7a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                </svg>
                Call back {formatPhone(fromRaw)}
              </a>
            )}
            <a
              href={vcardHref}
              download={`contact-${safeName(fromRaw)}.vcf`}
              className="btn-ghost text-sm"
            >
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm-4 4v4m0 0H8m4 0h4" />
              </svg>
              Save contact
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
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Recording
              </div>
              <audio
                controls
                preload="none"
                src={`/api/recording/${encodeURIComponent(call.recordId)}`}
                className="w-full"
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* Summary */}
          {call.summary && (
            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Summary
              </div>
              <div className="rounded-xl border border-bg-edge bg-bg-panel/60 p-4 text-sm leading-relaxed text-ink">
                {call.summary}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
              Your notes
            </div>
            <NotesForm callId={id} initialNotes={existingNote} saved={sp.saved === "1"} />
          </div>

          {/* Transcript */}
          {call.transcript && call.transcript.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Transcript
              </div>
              <div className="space-y-3 rounded-xl border border-bg-edge bg-bg-panel/60 p-4">
                {call.transcript.map((line, i) => {
                  const isAgent = /agent|assistant|ai|gia|ria|roxy/i.test(line.role);
                  return (
                    <div key={i} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          isAgent
                            ? "bg-bg-edge text-ink"
                            : "bg-gradient-to-r from-accent-violet/30 to-accent-cyan/20 text-ink"
                        }`}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">
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
              <details className="rounded-xl border border-bg-edge bg-bg-panel/60 p-4">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-ink-dim">
                  Post-call analysis
                </summary>
                <pre className="mt-3 overflow-x-auto text-xs text-ink-dim">
                  {JSON.stringify(call.analyzed, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-bg-edge bg-bg-panel/60 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">{label}</div>
      <div className="mt-0.5 font-semibold text-ink">{value}</div>
    </div>
  );
}

function buildTelHref(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/[^\d+]/g, "");
  if (!digits) return "";
  return `tel:${digits.startsWith("+") ? digits : `+${digits}`}`;
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
  const note = `Inbound call to ${call.flowName || "AllTheCalls agent"}${dateLabel ? " on " + dateLabel : ""}`;
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
