import crypto from "node:crypto";
import { cookies } from "next/headers";

export type Session = {
  email: string;
  name: string;
  agentId: string;
  flowId: string;
  iat: number;
};

const COOKIE_NAME = "atc_portal_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createToken(s: Omit<Session, "iat">): string {
  const payload: Session = { ...s, iat: Math.floor(Date.now() / 1000) };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyToken(token: string): Session | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = sign(data);
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE_NAME);
}

export const COOKIE_KEY = COOKIE_NAME;
