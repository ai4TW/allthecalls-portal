import { getSupabaseAdmin } from "./supabase";

export async function getNote(userId: string, callId: string): Promise<string> {
  const supa = getSupabaseAdmin();
  const { data } = await supa
    .from("call_notes")
    .select("notes")
    .eq("portal_user_id", userId)
    .eq("call_id", callId)
    .maybeSingle();
  return (data?.notes as string) || "";
}

export async function saveNote(
  userId: string,
  callId: string,
  notes: string,
): Promise<void> {
  const supa = getSupabaseAdmin();
  const { error } = await supa
    .from("call_notes")
    .upsert(
      {
        portal_user_id: userId,
        call_id: callId,
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "portal_user_id,call_id" },
    );
  if (error) throw new Error(`save note: ${error.message}`);
}
