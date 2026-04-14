import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { deleteUser } from "@/lib/users";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const id = String(fd.get("id") || "");
  if (!id) return NextResponse.redirect(new URL("/admin", req.url), 303);

  try {
    await deleteUser(id);
  } catch (e) {
    const msg = encodeURIComponent((e as Error).message);
    return NextResponse.redirect(new URL(`/admin?error=${msg}`, req.url), 303);
  }
  return NextResponse.redirect(new URL("/admin?deleted=1", req.url), 303);
}
