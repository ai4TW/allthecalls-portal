"use server";

import { revalidatePath } from "next/cache";
import { findTenant } from "@/lib/tenants";
import {
  updateTenantLeadStatus,
  addTenantNote,
  type LeadStatus,
} from "@/lib/client-leads";

export async function updateLeadStatusAction(formData: FormData) {
  const slug = String(formData.get("tenant") || "");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as LeadStatus;
  if (!slug || !id || !status) return;

  const tenant = findTenant(slug);
  if (!tenant) return;

  try {
    await updateTenantLeadStatus(tenant, id, status);
  } catch (e) {
    console.warn("[tenant/actions] updateLeadStatusAction failed:", e);
  }
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/pipeline`);
  revalidatePath(`/${slug}/leads/${id}`);
}

export async function addNoteAction(formData: FormData) {
  const slug = String(formData.get("tenant") || "");
  const id = String(formData.get("id") || "");
  const note = String(formData.get("note") || "").trim();
  if (!slug || !id || !note) return;

  const tenant = findTenant(slug);
  if (!tenant) return;

  try {
    await addTenantNote(tenant, id, note);
  } catch (e) {
    console.warn("[tenant/actions] addNoteAction failed:", e);
  }
  revalidatePath(`/${slug}/leads/${id}`);
}
