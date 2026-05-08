import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { IdentityManager } from "@/lib/identity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verify Workshop exists and is in Anonymous Mode
    const workshop = await prisma.workshop.findUnique({
      where: { id, active: true },
    });

    if (!workshop || !workshop.isAnonymous) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 2. Initialize Redirect Response
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const redirectUrl = baseUrl ? `${baseUrl}/workshop/catalog` : new URL(`/workshop/catalog`, request.url);
    const response = NextResponse.redirect(redirectUrl);

    // 3. Create or Resume Anonymous Session
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);

    session.workshopId = workshop.id;
    session.guestId = "";
    session.isLoggedIn = true;
    
    if (!session.shortCode) {
      session.shortCode = IdentityManager.generateAlias();
    }

    // This saves it to the cookie store directly, surviving the redirect!
    await session.save();

    // 4. Set persistent session token for client-side SessionManager
    const sessionToken = randomUUID();
    cookieStore.set("workshop_session_token", sessionToken, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax",
    });

    return response;


  } catch (error) {
    console.error("Anonymous entry error:", error);
    return NextResponse.json({ error: "Access failed" }, { status: 500 });
  }
}
