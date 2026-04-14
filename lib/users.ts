import crypto from "node:crypto";
import { getSupabaseAdmin, type PortalUserRow } from "./supabase";

export type PortalUser = {
  id: string;
  email: string;
  name: string;
  agentId: string;
  flowId: string;
  accessToken: string;
};

function toUser(row: PortalUserRow): PortalUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    agentId: row.agent_id,
    flowId: row.flow_id || "",
    accessToken: row.access_token,
  };
}

export async function listUsers(): Promise<PortalUser[]> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("portal_users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Supabase list users: ${error.message}`);
  return (data as PortalUserRow[]).map(toUser);
}

export async function findUserByToken(token: string): Promise<PortalUser | null> {
  if (!token) return null;
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from("portal_users")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();
  if (!data) return null;
  // Touch last_login_at (fire-and-forget)
  supa
    .from("portal_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});
  return toUser(data as PortalUserRow);
}

export class DuplicateUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateUserError";
  }
}

export async function createUser(input: {
  email: string;
  name: string;
  agentId: string;
  flowId?: string;
}): Promise<PortalUser> {
  const token = crypto.randomBytes(24).toString("base64url");
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from("portal_users")
    .insert({
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      agent_id: input.agentId,
      flow_id: input.flowId || null,
      access_token: token,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new DuplicateUserError(
        "That client already has a login for this agent. Scroll down to their row and click Send welcome email.",
      );
    }
    throw new Error(`Supabase create user: ${error.message}`);
  }
  return toUser(data as PortalUserRow);
}

export async function deleteUser(id: string): Promise<void> {
  const supa = getSupabaseAdmin();
  const { error } = await supa.from("portal_users").delete().eq("id", id);
  if (error) throw new Error(`Supabase delete user: ${error.message}`);
}

export async function markEmailSent(id: string): Promise<void> {
  const supa = getSupabaseAdmin();
  await supa
    .from("portal_users")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", id);
}

export async function getUserById(id: string): Promise<PortalUser | null> {
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from("portal_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return toUser(data as PortalUserRow);
}
