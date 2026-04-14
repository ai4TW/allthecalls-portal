import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCall, getRecordingUrl } from "@/lib/trillet";
import Nav from "@/components/Nav";
import { formatDateTime, formatDuration, formatPhone, statusColor } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const call = await getCall(id);
  if (!call) notFound();

  const recording = call.recordingUrl || (await getRecordingUrl(id));

  let transcriptLines: Array<{ role: string; text: string }> = [];
  if (Array.isArray(call.transcript)) {
    transcriptLines = call.transcript.map((t) => ({
      role: t.role || "?",
      text: t.text || "",
    }));
  } else if (typeof call.transcript === "string" && call.transcript.length > 0) {
    transcriptLines = call.transcript
      .split("\n")
      .filter(Boolean)
      .map((line) => ({ role: "transcript", text: line }));
  }

  return (
    <>
      <Nav session={session} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <Link href="/calls" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-dim hover:text-accent-cyan">
          ← All calls
        </Link>

        <div className="card p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                {call.direction || "call"} · {formatDateTime(call.startedAt || call.createdAt)}
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

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Duration" value={formatDuration(call.duration)} />
            <Stat label="Cost" value={call.cost ? `$${call.cost.toFixed(2)}` : "—"} />
            <Stat label="Agent" value={call.flowName || "Gia"} />
          </div>

          {recording && (
            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Recording
              </div>
              <audio controls src={recording} className="w-full">
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

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

          {transcriptLines.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Transcript
              </div>
              <div className="space-y-3 rounded-xl border border-bg-edge bg-bg-panel/60 p-4">
                {transcriptLines.map((line, i) => {
                  const isAgent = /agent|assistant|ai|gia/i.test(line.role);
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
