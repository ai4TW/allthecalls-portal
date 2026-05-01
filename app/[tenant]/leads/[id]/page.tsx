import Link from "next/link";
import { notFound } from "next/navigation";
import { findTenant } from "@/lib/tenants";
import {
  fetchTenantLeadDetail,
  STATUS_ORDER,
  STATUS_LABEL,
  STATUS_COLOR,
  formatTimeAgo,
  formatPhone,
  formatMoney,
  type LeadStatus,
} from "@/lib/client-leads";
import { updateLeadStatusAction, addNoteAction } from "../../actions";

export const dynamic = "force-dynamic";

const ACTIVITY_LABEL: Record<string, string> = {
  lead_created: "Lead created",
  note: "Note",
  call_inbound: "Inbound call",
  call_outbound: "Outbound call",
  sms_inbound: "Inbound text",
  sms_outbound: "Outbound text",
  email_inbound: "Inbound email",
  email_outbound: "Outbound email",
  status_change: "Status change",
  offer_sent: "Offer sent",
  offer_accepted: "Offer accepted",
  offer_rejected: "Offer rejected",
  appointment_booked: "Appointment booked",
  appointment_completed: "Appointment completed",
  system: "System",
};

const ACTIVITY_ICON: Record<string, string> = {
  lead_created: "🌱", note: "📝", call_inbound: "📞", call_outbound: "📞",
  sms_inbound: "💬", sms_outbound: "💬", email_inbound: "✉️", email_outbound: "✉️",
  status_change: "🔄", offer_sent: "📄", offer_accepted: "✅", offer_rejected: "❌",
  appointment_booked: "📅", appointment_completed: "📅", system: "•",
};

export default async function TenantLeadDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: slug, id } = await params;
  const tenant = findTenant(slug);
  if (!tenant) notFound();

  const { lead, activity, isSample } = await fetchTenantLeadDetail(tenant, id);
  if (!lead) notFound();

  const phoneClean = lead.phone.replace(/\D/g, "");
  const tel = `tel:${phoneClean.length === 11 ? `+${phoneClean}` : `+1${phoneClean}`}`;
  const sms = `sms:${phoneClean.length === 11 ? `+${phoneClean}` : `+1${phoneClean}`}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <Link href={`/${tenant.slug}`} className="text-xs text-neutral-500 hover:text-neutral-800">
        ← Back to inbox
      </Link>

      {isSample && (
        <div className="mt-3 inline-block rounded bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
          Sample lead
        </div>
      )}

      <header className="mt-3 mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{lead.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
            <a href={tel} className="font-bold" style={{ color: tenant.primary }}>
              {formatPhone(lead.phone)}
            </a>
            {lead.property_address && (
              <span>📍 {lead.property_address}{lead.property_city ? `, ${lead.property_city}` : ""}</span>
            )}
            <span>Source: {lead.source}{lead.source_detail ? ` (${lead.source_detail})` : ""}</span>
          </div>
        </div>
        <StatusPill status={lead.status} />
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href={tel}
          className="rounded-lg px-5 py-3 text-sm font-bold text-white shadow"
          style={{ background: tenant.brand }}
        >
          📞 Call
        </a>
        <a href={sms} className="rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-bold">
          💬 Text
        </a>
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-bold"
          >
            ✉ Email
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.4fr_1fr]">
        {/* LEFT — notes + activity */}
        <div>
          <Card title="Add a note">
            <form action={addNoteAction} className="flex flex-col gap-3">
              <input type="hidden" name="tenant" value={tenant.slug} />
              <input type="hidden" name="id" value={lead.id} />
              <textarea
                name="note"
                rows={3}
                required
                placeholder="What did you learn? Next step?"
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-3 text-sm focus:border-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                className="self-start rounded-lg px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: tenant.brand }}
              >
                Save note
              </button>
            </form>
          </Card>

          <Card title="Activity">
            {activity.length === 0 ? (
              <div className="text-sm text-neutral-500">No activity yet.</div>
            ) : (
              <ol className="flex flex-col gap-3">
                {activity.map((a) => (
                  <li
                    key={a.id}
                    className="flex gap-3 rounded-lg bg-neutral-50 px-3.5 py-3"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm">
                      {ACTIVITY_ICON[a.type] || "•"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-bold">
                          {ACTIVITY_LABEL[a.type] || a.type}
                          {a.author && a.author !== "system" ? ` · ${a.author}` : ""}
                        </span>
                        <span className="whitespace-nowrap text-[11px] text-neutral-500">
                          {formatTimeAgo(a.created_at)}
                        </span>
                      </div>
                      {a.content && (
                        <div className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
                          {a.content}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* RIGHT — status, deal econ, contact, timing */}
        <div>
          <Card title="Status">
            <form action={updateLeadStatusAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="tenant" value={tenant.slug} />
              <input type="hidden" name="id" value={lead.id} />
              <select
                name="status"
                defaultValue={lead.status}
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg px-4 py-2 text-sm font-bold text-white"
                style={{ background: tenant.primary }}
              >
                Update
              </button>
            </form>
          </Card>

          <Card title="Deal economics">
            <KV label="Asking" value={formatMoney(lead.asking_price)} />
            <KV label="ARV" value={formatMoney(lead.arv)} />
            <KV label="Repairs" value={formatMoney(lead.repair_estimate)} />
            <KV label="Our offer" value={formatMoney(lead.our_offer)} highlight={tenant.brand} />
          </Card>

          <Card title="Contact">
            <KV label="Phone" value={formatPhone(lead.phone)} />
            <KV label="Email" value={lead.email || "—"} />
            <KV label="Address" value={lead.property_address || "—"} />
            <KV
              label="City"
              value={[lead.property_city, lead.property_state].filter(Boolean).join(", ") || "—"}
            />
          </Card>

          <Card title="Timing">
            <KV label="Created" value={formatTimeAgo(lead.created_at)} />
            <KV
              label="Last contacted"
              value={lead.last_contacted_at ? formatTimeAgo(lead.last_contacted_at) : "Never"}
            />
            <KV
              label="Next follow-up"
              value={lead.next_follow_up_at ? formatTimeAgo(lead.next_follow_up_at) : "Not set"}
            />
          </Card>

          {lead.motivation && (
            <Card title="Motivation">
              <p className="text-sm text-neutral-700">{lead.motivation}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-xl border border-neutral-200 bg-white px-5 py-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
        {title}
      </div>
      {children}
    </section>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-neutral-100 py-2 last:border-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <span
        className="text-right text-sm font-semibold"
        style={highlight ? { color: highlight, fontWeight: 800 } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: LeadStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
      style={{ background: `${color}22`, color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {STATUS_LABEL[status]}
    </span>
  );
}
