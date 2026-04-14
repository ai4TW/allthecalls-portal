import { NextResponse } from "next/server";
import { createToken, setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const fd = await req.formData();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const from = String(fd.get("from") || "/");

  const demoEmail = (process.env.DEMO_EMAIL || "").trim().toLowerCase();
  const demoPassword = process.env.DEMO_PASSWORD || "";
  const agentId = process.env.DEMO_AGENT_ID || "";
  const flowId = process.env.DEMO_FLOW_ID || "";
  const name = process.env.DEMO_CLIENT_NAME || "Demo Client";

  if (
    !demoEmail ||
    !demoPassword ||
    email !== demoEmail ||
    password !== demoPassword
  ) {
    return NextResponse.redirect(new URL(`/login?error=invalid`, req.url), 303);
  }

  const token = createToken({ email, name, agentId, flowId });
  await setSessionCookie(token);

  const safeFrom = from.startsWith("/") && !from.startsWith("//") ? from : "/";
  return NextResponse.redirect(new URL(safeFrom, req.url), 303);
}
