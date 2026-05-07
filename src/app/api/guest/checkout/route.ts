import { NextRequest, NextResponse } from "next/server"; // Updated: 2026-05-04
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);
    const sessionToken = request.cookies.get("workshop_session_token")?.value;

    if (!session.isLoggedIn || !session.workshopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { priceTierId } = body;

    if (!priceTierId) {
      return NextResponse.json({ error: "Payment method required" }, { status: 400 });
    }

    // 1. Find the OPEN cart with items and product details
    const cart = await prisma.cart.findFirst({
      where: {
        status: "OPEN",
        active: true,
        OR: [
          session.guestId ? { guestId: session.guestId } : { sessionToken, workshopId: session.workshopId }
        ]
      },
      include: { 
        items: {
          include: {
            product: {
              include: { tieredPrices: true }
            }
          }
        } 
      }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 2. Verify Price Tier exists
    const tier = await prisma.priceTier.findUnique({ where: { id: priceTierId } });
    if (!tier) return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });

    // 3. Calculate snapshots and total
    let totalAmount = 0;
    const itemUpdates = cart.items.map(item => {
      const tierPriceObj = item.product.tieredPrices.find(tp => tp.priceTierId === priceTierId);
      const priceAtPurchase = tierPriceObj ? tierPriceObj.price : item.product.price;
      totalAmount += priceAtPurchase * item.quantity;
      
      return prisma.cartItem.update({
        where: { id: item.id },
        data: {
          priceAtPurchase,
          priceTierId
        }
      });
    });

    // 4. Perform Checkout in Transaction
    await prisma.$transaction([
      ...itemUpdates,
      prisma.cart.update({
        where: { id: cart.id },
        data: {
          status: "ORDERED",
          priceTierId,
          totalAmount,
          orderedAt: new Date(),
          updatedById: "GUEST"
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
