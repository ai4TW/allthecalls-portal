import { NextResponse } from "next/server";
import { findUserByToken } from "@/lib/users";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const user = await findUserByToken(token);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", req.url), 303);
  }

  const sessionToken = createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    agentId: user.agentId,
    flowId: user.flowId,
  });
  await setSessionCookie(sessionToken);

  return NextResponse.redirect(new URL("/", req.url), 303);
}
