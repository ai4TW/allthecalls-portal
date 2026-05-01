import Link from "next/link";
import { notFound } from "next/navigation";
import { findTenant } from "@/lib/tenants";
import { listCallsForAgent, type Call } from "@/lib/trillet";
import { formatDuration, formatPhone, formatRelative, statusColor } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TenantCallsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = findTenant(slug);
  if (!tenant) notFound();

  const agentId = tenant.trilletAgentId;
  let calls: Call[] = [];
  let error: string | null = null;
  let configError: string | null = null;

  if (!agentId) {
    configError = `Set ${tenant.slug.toUpperCase()}_TRILLET_AGENT_ID in Vercel to load this tenant's calls.`;
  } else {
    try {
      calls = await listCallsForAgent(agentId, undefined, 200);
    } catch (e) {
      error = (e as Error).message;
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">Calls</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            AI receptionist log
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {calls.length} {calls.length === 1 ? "call" : "calls"} for {tenant.name}
          </p>
        </div>
        {agentId && (
          <a
            href={`/api/export?transcripts=1&analysis=1`}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-bold"
          >
            Export CSV
          </a>
        )}
      </header>

      {configError ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
          <div className="font-semibold">Config needed</div>
          <div className="mt-1 text-sm">{configError}</div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-6 text-rose-900">
          <div className="font-semibold">Couldn&rsquo;t load calls</div>
          <div className="mt-1 text-sm">{error}</div>
        </div>
      ) : calls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="text-3xl">📞</div>
          <h3 className="mt-3 font-bold">No calls yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-600">
            When Jaz handles a call on this number, it&rsquo;ll show up here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {calls.map((c) => (
            <Link
              key={c.id}
              href={`/${tenant.slug}/calls/${encodeURIComponent(c.id)}`}
              className="group flex items-center gap-3 border-b border-neutral-200 px-4 py-3.5 transition hover:bg-neutral-50 md:gap-4 md:px-5"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${tenant.brand}1f`, color: tenant.brand }}
              >
                {c.direction === "outbound" ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l6 6m-6-6l6-6" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate font-semibold">{formatPhone(c.from) || "Unknown"}</div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor(c.status)}`}
                  >
                    {c.status || "—"}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-sm text-neutral-600">
                  {c.summary || `${c.direction || "call"} · ${formatRelative(c.startedAt)}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{formatDuration(c.duration)}</div>
                <div className="text-xs text-neutral-500">{formatRelative(c.startedAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
