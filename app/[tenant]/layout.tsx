import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { findTenant } from "@/lib/tenants";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tenant: slug } = await params;
  const tenant = findTenant(slug);
  if (!tenant) notFound();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F4F2EC" }}>
      {/* Tenant header with their brand */}
      <header
        style={{ background: tenant.primary }}
        className="text-white"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href={`/${tenant.slug}`} className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ background: "rgba(255,255,255,0.95)" }}
            >
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest opacity-70">AllTheCalls</div>
              <div className="text-sm font-bold leading-tight">{tenant.name}</div>
            </div>
          </Link>
          <nav className="hidden gap-1 md:flex">
            <TenantNavLink href={`/${tenant.slug}`} label="Inbox" />
            <TenantNavLink href={`/${tenant.slug}/pipeline`} label="Pipeline" />
            <TenantNavLink href={`/${tenant.slug}/calls`} label="Calls" />
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden md:inline opacity-80">{session.email}</span>
            <a
              href="/api/logout"
              className="rounded px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-white/10"
            >
              Sign out
            </a>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:hidden">
          <TenantNavLink href={`/${tenant.slug}`} label="Inbox" />
          <TenantNavLink href={`/${tenant.slug}/pipeline`} label="Pipeline" />
          <TenantNavLink href={`/${tenant.slug}/calls`} label="Calls" />
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function TenantNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm font-medium opacity-80 transition hover:bg-white/10 hover:opacity-100"
    >
      {label}
    </Link>
  );
}
