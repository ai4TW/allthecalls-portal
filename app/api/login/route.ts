import { NextResponse } from "next/server";
import { createToken, setSessionCookie } from "@/lib/session";
import { findUser } from "@/lib/users";

export async function POST(req: Request) {
  const fd = await req.formData();
  const email = String(fd.get("email") || "");
  const password = String(fd.get("password") || "");
  const from = String(fd.get("from") || "/");

  const user = findUser(email, password);
  if (!user) {
    return NextResponse.redirect(new URL(`/login?error=invalid`, req.url), 303);
  }

  const token = createToken({
    email: user.email,
    name: user.name,
    agentId: user.agentId,
    flowId: user.flowId,
  });
  await setSessionCookie(token);

  const safeFrom = from.startsWith("/") && !from.startsWith("//") ? from : "/";
  return NextResponse.redirect(new URL(safeFrom, req.url), 303);
}
