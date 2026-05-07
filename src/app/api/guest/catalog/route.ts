import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<GuestSessionData>(request, new NextResponse(), guestSessionOptions);

    if (!session.isLoggedIn || !session.workshopId) {
      console.log("Guest Auth Failed: Session not found or incomplete", { session });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // Fetch all active products and include stock for this workshop
    const [allProducts, priceTiers, reservations] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        include: {
          categories: { select: { name: true } },
          tieredPrices: { include: { priceTier: true } },
          workshopStock: {
            where: { workshopId: session.workshopId }
          }
        },
        orderBy: { name: "asc" }
      }),
      prisma.priceTier.findMany({ where: { active: true, softDeleted: false }, orderBy: { name: "asc" } }),
      prisma.cartItem.groupBy({
        by: ['productId'],
        where: {
          cart: {
            guest: { workshopId: session.workshopId },
            status: { in: ['OPEN', 'ORDERED', 'PREPARING', 'READY'] },
            active: true
          }
        },
        _sum: { quantity: true }
      })
    ]);

    const reservationMap = Object.fromEntries(reservations.map(r => [r.productId, r._sum.quantity || 0]));

    const products = allProducts.map(p => ({
      ...p,
      category: (p as any).categories?.[0]?.name || null,
      availableQuantity: p.workshopStock?.[0]?.quantity || 0,
      reservedCount: reservationMap[p.id] || 0
    }));

    return NextResponse.json({ products, priceTiers });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
