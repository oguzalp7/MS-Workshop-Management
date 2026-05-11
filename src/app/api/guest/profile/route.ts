import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";
import { cookies } from "next/headers";
import { IdentityManager } from "@/lib/identity";

// Guest profile handlers
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);

    if (!session.isLoggedIn || !session.workshopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Workshop Details (Required for both anonymous and registered)
    const workshop = await prisma.workshop.findUnique({
      where: { id: session.workshopId },
      select: {
        name: true,
        formConfig: { select: { fields: true } }
      }
    });

    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    // 2. Fetch Carts (Either by guestId or sessionToken)
    const sessionToken = request.cookies.get("workshop_session_token")?.value;
    const carts = await prisma.cart.findMany({
      where: {
        workshopId: session.workshopId,
        OR: [
          session.guestId ? { guestId: session.guestId } : { sessionToken }
        ]
      },
      include: {
        priceTier: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, price: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 3. Construct Unified Response
    let guest = null;
    let reclaimedSessionToken = null;

    if (session.guestId) {
      guest = await prisma.guest.findUnique({
        where: { id: session.guestId },
      });
    } else if (sessionToken) {
      guest = await prisma.guest.findUnique({
        where: { sessionToken },
      });
    } else if (session.shortCode) {
      // SAFARI RE-CLAIM LOGIC
      // If we lost the sessionToken cookie but still have the iron-session (shortCode),
      // we can try to find the guest in the DB.
      guest = await prisma.guest.findFirst({
        where: { 
          shortCode: session.shortCode, 
          workshopId: session.workshopId 
        },
      });
      if (guest) reclaimedSessionToken = guest.sessionToken;
    }

    if (guest) {
      const response = NextResponse.json({ 
        guest: { 
          ...guest, 
          workshop, 
          carts 
        } 
      });

      // If we reclaimed the session, restore the cookie!
      if (reclaimedSessionToken) {
        response.cookies.set("workshop_session_token", reclaimedSessionToken, {
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
          sameSite: "lax",
        });
      }

      return response;
    }

    // Anonymous Mock Guest
    return NextResponse.json({
      guest: {
        id: sessionToken,
        shortCode: session.shortCode,
        profileData: {},
        workshop,
        carts
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);
    const sessionToken = request.cookies.get("workshop_session_token")?.value;

    if (!session.workshopId || !sessionToken) {
      return NextResponse.json({ error: "Workshop context lost" }, { status: 400 });
    }

    const { profileData } = await request.json();

    // 1. Find or Create Guest
    let guest;
    if (session.guestId) {
      guest = await prisma.guest.update({
        where: { id: session.guestId },
        data: { profileData: profileData || {} }
      });
    } else {
      guest = await prisma.guest.upsert({
        where: { sessionToken },
        update: {
          profileData: profileData || {},
          shortCode: session.shortCode || IdentityManager.generateAlias(),
          workshopId: session.workshopId,
        },
        create: {
          sessionToken,
          shortCode: session.shortCode || IdentityManager.generateAlias(),
          workshopId: session.workshopId,
          profileData: profileData || {},
          createdById: "GUEST",
          updatedById: "GUEST",
        }
      });
    }

    // 2. Link existing carts to this guest
    await prisma.cart.updateMany({
      where: { sessionToken, guestId: null },
      data: { guestId: guest.id }
    });

    // 3. Update session if needed
    session.shortCode = guest.shortCode!;
    await session.save();

    return NextResponse.json({ success: true, guest });
  } catch (error) {
    console.error("[Profile POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
