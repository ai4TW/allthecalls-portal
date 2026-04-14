import type { Call } from "@/lib/trillet";
import { formatDuration } from "@/lib/format";

export default function StatsBar({ calls }: { calls: Call[] }) {
  const total = calls.length;
  const totalDuration = calls.reduce((s, c) => s + (c.duration || 0), 0);
  const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
  const today = new Date();
  const todayCalls = calls.filter((c) => {
    const d = new Date(c.startedAt || c.createdAt || 0);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  const stats = [
    { label: "Today", value: String(todayCalls) },
    { label: "Total Calls", value: String(total) },
    { label: "Avg Duration", value: formatDuration(avgDuration) },
    { label: "Talk Time", value: formatDuration(totalDuration) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="card p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-mute">{s.label}</div>
          <div className="mt-1 font-display text-2xl font-semibold gradient-text">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
