import { getSupabaseAdmin } from "./supabase";

export type VideoLead = {
  id: string;
  firstName: string | null;
  email: string;
  phone: string | null;
  businessType: string | null;
  source: string | null;
  referrer: string | null;
  userAgent: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  first_name: string | null;
  email: string;
  phone: string | null;
  business_type: string | null;
  source: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
};

function toLead(r: Row): VideoLead {
  return {
    id: r.id,
    firstName: r.first_name,
    email: r.email,
    phone: r.phone,
    businessType: r.business_type,
    source: r.source,
    referrer: r.referrer,
    userAgent: r.user_agent,
    createdAt: r.created_at,
  };
}

export async function listRecentLeads(limit = 50): Promise<VideoLead[]> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("video_leads")
    .select(
      "id, first_name, email, phone, business_type, source, referrer, user_agent, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Supabase list leads: ${error.message}`);
  }
  return (data as Row[]).map(toLead);
}

export async function countLeadsSince(iso: string): Promise<number> {
  const supa = getSupabaseAdmin();
  const { count, error } = await supa
    .from("video_leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", iso);
  if (error) return 0;
  return count || 0;
}
