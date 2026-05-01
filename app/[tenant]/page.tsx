import Link from "next/link";
import { notFound } from "next/navigation";
import { findTenant } from "@/lib/tenants";
import {
  fetchTenantLeads,
  STATUS_LABEL,
  STATUS_COLOR,
  formatTimeAgo,
  formatPhone,
  formatMoney,
  type LeadStatus,
} from "@/lib/client-leads";

export const dynamic = "force-dynamic";

export default async function TenantInboxPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = findTenant(slug);
  if (!tenant) notFound();

  const { leads, isSample } = await fetchTenantLeads(tenant);

  const newCount = leads.filter((l) => l.status === "new").length;
  const dueToday = leads.filter((l) => {
    if (!l.next_follow_up_at) return false;
    const due = new Date(l.next_follow_up_at);
    return due <= new Date(Date.now() + 1000 * 60 * 60 * 24);
  }).length;
  const inFlight = leads.filter((l) => !["closed", "dead"].includes(l.status)).length;
  const sumOffers = leads
    .filter((l) => l.our_offer && !["dead"].includes(l.status))
    .reduce((s, l) => s + (l.our_offer ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">Inbox</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Today&rsquo;s Leads
          </h1>
        </div>
        {isSample && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
            Sample data — set {tenant.supabaseServiceRoleKeyEnv} in Vercel to see real leads
          </span>
        )}
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Stat label="New" value={String(newCount)} accent="#0EA5E9" />
        <Stat label="Due in 24h" value={String(dueToday)} accent="#F59E0B" />
        <Stat label="In pipeline" value={String(inFlight)} accent="#10B981" />
        <Stat label="Active offers" value={formatMoney(sumOffers)} accent={tenant.brand} />
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="grid grid-cols-[1.2fr_1fr_130px_110px_110px] border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 max-md:hidden">
          <div>Seller</div>
          <div>Property</div>
          <div>Status</div>
          <div>Source</div>
          <div className="text-right">When</div>
        </div>
        {leads.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            No leads yet — they&rsquo;ll show up here as soon as Jaz captures one.
          </div>
        ) : (
          leads.map((l) => (
            <Link
              key={l.id}
              href={`/${tenant.slug}/leads/${l.id}`}
              className="grid grid-cols-1 gap-1 border-b border-neutral-200 px-4 py-3 text-sm transition hover:bg-neutral-50 md:grid-cols-[1.2fr_1fr_130px_110px_110px] md:items-center md:gap-3 md:py-3.5"
            >
              <div>
                <div className="font-bold">{l.name}</div>
                <div className="text-xs text-neutral-500">{formatPhone(l.phone)}</div>
              </div>
              <div>
                <div>{l.property_address || <span className="text-neutral-400">—</span>}</div>
                <div className="text-xs text-neutral-500">
                  {[l.property_city, l.property_state].filter(Boolean).join(", ")}
                </div>
              </div>
              <div>
                <StatusPill status={l.status} />
              </div>
              <div className="text-xs text-neutral-600">
                {sourceLabel(l.source)}
              </div>
              <div className="text-xs text-neutral-500 md:text-right">
                {formatTimeAgo(l.created_at)}
              </div>
            </Link>
          ))
        )}
      </section>

      <div className="mt-6 text-xs text-neutral-500">
        Showing {leads.length} {leads.length === 1 ? "lead" : "leads"}
        {isSample ? " (sample)" : " (live)"}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white px-5 py-4">
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="text-xs font-medium text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: LeadStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: `${color}22`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

function sourceLabel(s: string): string {
  if (s === "phone") return "📞 Phone";
  if (s === "web") return "🌐 Web";
  if (s === "direct_mail") return "📬 Mail";
  if (s === "referral") return "🤝 Referral";
  if (s === "sms") return "💬 SMS";
  return s;
}
