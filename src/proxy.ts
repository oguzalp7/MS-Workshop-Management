import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Admin Route Protection ─────────────────────────────────────
  // Skip login page and API routes
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/api/")
  ) {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // ─── Guest UUID Validation (future) ─────────────────────────────
  // /join/[guest_uuid] routes will be validated here
  // if (pathname.startsWith("/join/")) {
  //   const uuid = pathname.split("/join/")[1];
  //   // Validate UUID against active workshops
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
