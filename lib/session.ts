import crypto from "node:crypto";
import { cookies } from "next/headers";

export type Session = {
  userId: string;
  email: string;
  name: string;
  agentId: string;
  flowId: string;
  iat: number;
};

const SESSION_COOKIE = "atc_portal_session";
const ADMIN_COOKIE = "atc_portal_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

function pack<T>(obj: T): string {
  const data = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function unpack<T>(token: string): T | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = sign(data);
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  )
    return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export function createSessionToken(s: Omit<Session, "iat">): string {
  return pack({ ...s, iat: Math.floor(Date.now() / 1000) });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return unpack<Session>(token);
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

// Admin session — separate cookie
export type AdminSession = { iat: number };

export function createAdminToken(): string {
  return pack<AdminSession>({ iat: Math.floor(Date.now() / 1000) });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return unpack<AdminSession>(token);
}

export async function setAdminCookie(token: string) {
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export const COOKIE_KEYS = { session: SESSION_COOKIE, admin: ADMIN_COOKIE };
