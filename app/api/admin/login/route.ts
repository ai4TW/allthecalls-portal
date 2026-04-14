import { NextResponse } from "next/server";
import { createAdminToken, setAdminCookie } from "@/lib/session";

export async function POST(req: Request) {
  const fd = await req.formData();
  const password = String(fd.get("password") || "");
  const from = String(fd.get("from") || "/admin");

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", req.url), 303);
  }

  await setAdminCookie(createAdminToken());
  const safeFrom = from.startsWith("/admin") ? from : "/admin";
  return NextResponse.redirect(new URL(safeFrom, req.url), 303);
}
