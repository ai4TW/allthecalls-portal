import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { getUserById, markEmailSent } from "@/lib/users";
import { sendWelcomeEmail } from "@/lib/email";

function baseUrl(req: Request): string {
  const envUrl = process.env.PORTAL_PUBLIC_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const url = new URL(req.url);
  // On Vercel, req.url uses the deployment hostname — prefer host header for the
  // canonical custom domain.
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  if (host) return `${proto}://${host}`;
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const id = String(fd.get("id") || "");
  const user = await getUserById(id);
  if (!user) {
    return NextResponse.redirect(new URL("/admin?error=user_not_found", req.url), 303);
  }

  const accessUrl = `${baseUrl(req)}/access/${user.accessToken}`;

  try {
    await sendWelcomeEmail({ to: user.email, name: user.name, accessUrl });
    await markEmailSent(user.id);
  } catch (e) {
    const msg = encodeURIComponent((e as Error).message);
    return NextResponse.redirect(new URL(`/admin?error=${msg}`, req.url), 303);
  }
  return NextResponse.redirect(new URL(`/admin?sent=${encodeURIComponent(user.email)}`, req.url), 303);
}
