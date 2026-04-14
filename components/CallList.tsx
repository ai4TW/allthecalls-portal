import Link from "next/link";
import type { Call } from "@/lib/trillet";
import { formatDuration, formatPhone, formatRelative, statusColor } from "@/lib/format";

export default function CallList({ calls }: { calls: Call[] }) {
  if (calls.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-edge">
          <svg className="h-7 w-7 text-ink-mute" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.3a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-1.7.85a11 11 0 005.52 5.52l.85-1.7a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
          </svg>
        </div>
        <h3 className="font-semibold text-ink">No calls yet</h3>
        <p className="mt-1 text-sm text-ink-dim">When your AI handles a call, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="card divide-y divide-bg-edge overflow-hidden">
      {calls.map((c) => (
        <Link
          key={c.id}
          href={`/calls/${encodeURIComponent(c.id)}`}
          className="group flex items-center gap-4 px-4 py-4 transition hover:bg-bg-edge/30 md:px-6"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-violet/20 to-accent-cyan/20 ring-1 ring-bg-edge">
            <svg className="h-5 w-5 text-accent-cyan" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {c.direction === "outbound" ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l6 6m-6-6l6-6" />
              )}
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="truncate font-semibold text-ink">{formatPhone(c.from)}</div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor(c.status)}`}>
                {c.status || "—"}
              </span>
            </div>
            <div className="mt-0.5 truncate text-sm text-ink-dim">
              {c.summary || `${c.direction || "call"} · ${formatRelative(c.startedAt || c.createdAt)}`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-ink">{formatDuration(c.duration)}</div>
            <div className="text-xs text-ink-mute">{formatRelative(c.startedAt || c.createdAt)}</div>
          </div>
          <svg className="hidden h-4 w-4 text-ink-mute transition group-hover:translate-x-1 group-hover:text-accent-cyan md:block" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ))}
    </div>
  );
}
