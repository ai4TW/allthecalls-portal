import Link from "next/link";
import { notFound } from "next/navigation";
import { findTenant } from "@/lib/tenants";
import {
  fetchTenantLeads,
  STATUS_ORDER,
  STATUS_LABEL,
  STATUS_COLOR,
  formatTimeAgo,
  formatPhone,
  formatMoney,
  type LeadRow,
  type LeadStatus,
} from "@/lib/client-leads";

export const dynamic = "force-dynamic";

const VISIBLE: LeadStatus[] = STATUS_ORDER.filter((s) => s !== "dead");

export default async function TenantPipelinePage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = findTenant(slug);
  if (!tenant) notFound();

  const { leads, isSample } = await fetchTenantLeads(tenant);

  const byStatus: Record<LeadStatus, LeadRow[]> = {
    new: [], contacted: [], qualified: [], offer_sent: [], under_contract: [], closed: [], dead: [],
  };
  for (const l of leads) byStatus[l.status].push(l);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">Pipeline</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Deal flow</h1>
        </div>
        {isSample && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
            Sample data
          </span>
        )}
      </header>

      <div className="grid auto-cols-[minmax(240px,_1fr)] grid-flow-col gap-3 overflow-x-auto pb-3">
        {VISIBLE.map((status) => (
          <div
            key={status}
            className="flex min-h-[400px] flex-col rounded-xl border border-neutral-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[status] }} />
                <span className="text-xs font-bold uppercase tracking-wider">{STATUS_LABEL[status]}</span>
              </div>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
                {byStatus[status].length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
              {byStatus[status].length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400">Empty</div>
              ) : (
                byStatus[status].map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/${tenant.slug}/leads/${lead.id}`}
                    className="block rounded-lg border border-transparent bg-neutral-50 px-3 py-2.5 transition hover:border-neutral-300 hover:bg-white"
                  >
                    <div className="text-sm font-bold">{lead.name}</div>
                    <div className="text-xs text-neutral-500">
                      {lead.property_address || formatPhone(lead.phone)}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>{lead.property_city || "—"}</span>
                      <span>{formatTimeAgo(lead.created_at)}</span>
                    </div>
                    {lead.our_offer != null && (
                      <div
                        className="mt-1.5 text-xs font-bold"
                        style={{ color: tenant.brand }}
                      >
                        Offer: {formatMoney(lead.our_offer)}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
