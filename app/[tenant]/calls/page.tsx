import Link from "next/link";
import { notFound } from "next/navigation";
import { findTenant } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function TenantCallsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = findTenant(slug);
  if (!tenant) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="text-xs uppercase tracking-widest text-neutral-500">Calls</div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
        AI receptionist log
      </h1>
      <p className="mt-4 text-sm text-neutral-600 md:text-base">
        Every call your AI agent answers will land here with the full transcript and a summary.
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
        <div className="text-3xl">📞</div>
        <div className="mt-3 font-bold">Call sync wires up next</div>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
          Once the Trillet webhook is connected to {tenant.name}&rsquo;s agent, every call will
          flow into the lead&rsquo;s activity timeline automatically.
        </p>
        <Link
          href="/calls"
          className="mt-5 inline-block rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-bold"
        >
          Open legacy call view →
        </Link>
      </div>
    </div>
  );
}
