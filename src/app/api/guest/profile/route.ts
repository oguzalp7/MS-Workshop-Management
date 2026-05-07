import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<GuestSessionData>(request, new NextResponse(), guestSessionOptions);

    if (!session.isLoggedIn || !session.guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
