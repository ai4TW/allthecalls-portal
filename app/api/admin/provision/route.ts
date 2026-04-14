import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { createUser, DuplicateUserError } from "@/lib/users";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const email = String(fd.get("email") || "").trim();
  const name = String(fd.get("name") || "").trim();
  const agentId = String(fd.get("agentId") || "").trim();
  const flowId = String(fd.get("flowId") || "").trim();

  if (!email || !name || !agentId) {
    return NextResponse.redirect(new URL("/admin?error=missing", req.url), 303);
  }

  try {
    await createUser({ email, name, agentId, flowId });
  } catch (e) {
    if (e instanceof DuplicateUserError) {
      return NextResponse.redirect(new URL("/admin?duplicate=1", req.url), 303);
    }
    const msg = encodeURIComponent((e as Error).message);
    return NextResponse.redirect(new URL(`/admin?error=${msg}`, req.url), 303);
  }
  return NextResponse.redirect(new URL("/admin?created=1", req.url), 303);
}
