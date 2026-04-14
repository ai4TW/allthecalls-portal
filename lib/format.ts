export function formatDuration(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPhone(p: string | undefined): string {
  if (!p) return "Unknown";
  const d = p.replace(/[^\d]/g, "");
  if (d.length === 11 && d.startsWith("1")) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return p;
}

export function formatRelative(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function statusColor(status: string | undefined): string {
  const s = (status || "").toLowerCase();
  if (s.includes("complet") || s === "ended" || s === "success") return "text-emerald-400 bg-emerald-400/10";
  if (s.includes("fail") || s.includes("error")) return "text-rose-400 bg-rose-400/10";
  if (s.includes("missed") || s.includes("no-answer")) return "text-amber-400 bg-amber-400/10";
  if (s.includes("active") || s.includes("ringing") || s.includes("in-progress")) return "text-cyan-400 bg-cyan-400/10";
  return "text-ink-dim bg-bg-edge";
}
