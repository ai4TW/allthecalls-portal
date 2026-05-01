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
  agentId?: string;                  // Trillet agent (links to call history view)
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
  },
];

export function findTenant(slug: string): Tenant | undefined {
  return TENANTS.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
}
