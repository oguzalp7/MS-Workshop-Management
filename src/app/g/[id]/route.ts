import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const redirectUrl = baseUrl ? `${baseUrl}/workshop/catalog` : new URL(`/workshop/catalog`, request.url);
    const response = NextResponse.redirect(redirectUrl);

    // 3. Initialize Guest Session using that response
    const session = await getIronSession<GuestSessionData>(request, response, guestSessionOptions);
    session.guestId = guest.id;
    session.workshopId = guest.workshopId;
    session.isLoggedIn = true;
    await session.save(); // This now correctly attaches headers to the redirect

    return response;

  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
