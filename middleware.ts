import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/", "/calls"];
const PUBLIC = ["/login", "/api/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
  const isProtected =
    PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/calls");
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("atc_portal_session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api/login|api/logout|favicon.ico|manifest.json).*)"],
};
