import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);
    const sessionToken = request.cookies.get("workshop_session_token")?.value;

    // Resilience: If session is missing but we have a valid workshop_session_token cookie, 
    // we can still identify the workshop for anonymous catalog viewing.
    let workshopId = session.workshopId;
    if (!workshopId && sessionToken) {
       // Try to find the latest cart or just use the token to stay in context
       const lastCart = await prisma.cart.findFirst({
         where: { sessionToken, status: 'OPEN' },
         select: { workshopId: true }
       });
       if (lastCart) workshopId = lastCart.workshopId;
    }

    if (!session.isLoggedIn && !workshopId) {
      console.warn("[Catalog API] Unauthorized:", { 
        isLoggedIn: session.isLoggedIn, 
        workshopId,
        hasToken: !!sessionToken
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const effectiveWorkshopId = workshopId || session.workshopId;
    if (!effectiveWorkshopId) return NextResponse.json({ error: "Workshop context lost" }, { status: 400 });


    // Fetch all active products and include stock for this workshop
    const [allProducts, priceTiers, reservations] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        include: {
          categories: { select: { name: true } },
          tieredPrices: { include: { priceTier: true } },
          workshopStock: {
            where: { workshopId: effectiveWorkshopId }
          }
        },
        orderBy: { name: "asc" }
      }),
      prisma.priceTier.findMany({ where: { active: true, softDeleted: false }, orderBy: { name: "asc" } }),
      prisma.cartItem.groupBy({
        by: ['productId'],
        where: {
          cart: {
            workshopId: effectiveWorkshopId,
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
