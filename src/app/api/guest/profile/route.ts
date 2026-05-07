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

    // If it's an anonymous session, return session info only
    if (!session.guestId) {
      const sessionToken = request.cookies.get("workshop_session_token")?.value;
      return NextResponse.json({ sessionToken });
    }


    const guest = await prisma.guest.findUnique({
      where: { id: session.guestId },
      include: {
        workshop: {
          select: {
             name: true,
             formConfig: {
                select: { fields: true }
             }
          }
        },
        carts: {
          include: {
            priceTier: { select: { name: true } },
            items: {
              include: {
                product: {
                  select: { name: true, price: true }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    return NextResponse.json({ guest });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
