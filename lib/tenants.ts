/**
 * Tenant registry — every AllTheCalls DFY client that has a per-tenant
 * leads/CRM page lives here.
 *
 * For v1 we only have WBHC. New tenants get added inline + their Supabase
 * service-role key gets set in Vercel env via the variable named in
 * `supabaseServiceRoleKeyEnv` (so secrets stay out of code).
 */

export interface Tenant {
  slug: string;                      // URL slug — app.allthecalls.ai/<slug>
  name: string;                      // Display name
  brand: string;                     // Accent / CTA color
  primary: string;                   // Header / dark surface color
  logoUrl: string;                   // Path under /public
  publicSiteUrl: string;             // Their marketing site
  supabaseUrl: string;               // Tenant's Supabase project URL
  supabaseServiceRoleKeyEnv: string; // Name of env var holding the service-role key
  trilletAgentId?: string;           // Trillet agent — used to route inbound webhooks to this tenant
  vertical?: "real_estate" | "trades"; // Changes Inbox field labels (seller/property vs. customer/job)
}

export const TENANTS: Tenant[] = [
  {
    slug: "wbhc",
    name: "We Buy Houses Columbia",
    brand: "#3F7A5C",
    primary: "#1E3D52",
    logoUrl: "/tenants/wbhc.png",
    publicSiteUrl: "https://webuyhousescolumbia.co",
    supabaseUrl: "https://amvaplgwteeoxyutcegk.supabase.co",
    supabaseServiceRoleKeyEnv: "WBHC_SUPABASE_SERVICE_ROLE_KEY",
    trilletAgentId: process.env.WBHC_TRILLET_AGENT_ID,
    vertical: "real_estate",
  },
  // --- AllTheCalls DFY clients (added 2026-11-14, consolidation proof) ---
  // No *_SUPABASE_SERVICE_ROLE_KEY set for these yet on purpose: the Inbox
  // falls back to realistic sample data automatically (see
  // lib/client-leads.ts `fetchTenantLeads`), proving the white-label
  // architecture without touching any real client database. Give each its
  // own Supabase project (same isolation model as WBHC above) before
  // onboarding either for real — see the PR description's migration plan.
  {
    slug: "drainiacs",
    name: "Drainiacs Plumbing of Wichita",
    brand: "#B5452B", // brick
    primary: "#0E6E62", // jade
    logoUrl: "/tenants/drainiacs.svg",
    publicSiteUrl: "https://drainiacs-plumbing-wichita.vercel.app",
    supabaseUrl: "https://amvaplgwteeoxyutcegk.supabase.co",
    supabaseServiceRoleKeyEnv: "DRAINIACS_SUPABASE_SERVICE_ROLE_KEY",
    vertical: "trades",
  },
  {
    slug: "legends",
    name: "Legends Barber College",
    brand: "#B8894D", // brass
    primary: "#211D1A", // charcoal
    logoUrl: "/tenants/legends.svg",
    publicSiteUrl: "https://legends-barber-college.vercel.app",
    supabaseUrl: "https://amvaplgwteeoxyutcegk.supabase.co",
    supabaseServiceRoleKeyEnv: "LEGENDS_SUPABASE_SERVICE_ROLE_KEY",
    vertical: "trades",
  },
];

export function findTenant(slug: string): Tenant | undefined {
  return TENANTS.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
}

export function findTenantByAgentId(agentId: string): Tenant | undefined {
  if (!agentId) return undefined;
  return TENANTS.find((t) => t.trilletAgentId && t.trilletAgentId === agentId);
}

export function findTenantByMetadata(meta: Record<string, string> | undefined): Tenant | undefined {
  const slug = meta?.tenant_slug || meta?.tenantSlug;
  if (slug) return findTenant(slug);
  return undefined;
}
