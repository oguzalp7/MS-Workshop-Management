import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verify Guest exists and is active

    const guest = await prisma.guest.findUnique({
      where: { id, active: true },
      include: { workshop: true }
    });

    if (!guest) {
      // Redirect to a generic "Not Found" or "Expired" page
      return NextResponse.redirect(new URL("/expired", request.url));
    }

    // 2. Initialize Redirect Response FIRST
    const { origin } = new URL(request.url);
    const redirectUrl = `${origin}/workshop/catalog`;
    const response = NextResponse.redirect(redirectUrl);

    // 3. Create or Resume Persistent Session
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);
    
    session.guestId = guest.id;
    session.workshopId = guest.workshopId;
    session.isLoggedIn = true;
    
    // Save to global cookie store
    await session.save();

    // 4. Set persistent session token for client-side SessionManager
    cookieStore.set("workshop_session_token", guest.id, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax",
    });

    return response;

  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
