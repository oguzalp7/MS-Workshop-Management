import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";
import { cookies } from "next/headers";

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
    if (session.guestId) {
      const guest = await prisma.guest.findUnique({
        where: { id: session.guestId },
      });
      return NextResponse.json({ 
        guest: { 
          ...guest, 
          workshop, 
          carts 
        } 
      });
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
