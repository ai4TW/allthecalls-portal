import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/access", "/admin/login", "/api/login", "/api/admin/login"];
const ADMIN = ["/admin", "/api/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Admin routes require admin cookie
  if (ADMIN.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const token = req.cookies.get("atc_portal_admin")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Client-facing routes require session cookie
  const token = req.cookies.get("atc_portal_session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|favicon.svg|icon.svg|manifest.json|logo.svg|wordmark.svg).*)"],
};
