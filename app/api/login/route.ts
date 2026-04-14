import { NextResponse } from "next/server";

// Passwords are no longer supported — portal uses access-token URLs.
// The /login page now just shows a "contact your admin" message, so this
// endpoint exists only to redirect anything stale back to the login screen.
export async function POST(req: Request) {
  return NextResponse.redirect(new URL("/login?error=use_link", req.url), 303);
}
