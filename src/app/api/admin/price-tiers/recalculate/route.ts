import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { tierId } = body;

    const tier = await prisma.priceTier.findUnique({ where: { id: tierId } });
    if (!tier) return NextResponse.json({ error: "Tier not found" }, { status: 404 });

    // Fetch all products
    const products = await prisma.product.findMany({
      select: { id: true, price: true }
    });

    // Update or create prices for this tier
    for (const p of products) {
      const calculatedPrice = p.price * (1 + (tier.surchargePercentage / 100));
      
      await prisma.productPrice.upsert({
        where: {
          productId_priceTierId: {
            productId: p.id,
            priceTierId: tier.id
          }
        },
        create: {
          productId: p.id,
          priceTierId: tier.id,
          price: calculatedPrice
        },
        update: {
          price: calculatedPrice
        }
      });
    }

    return NextResponse.json({ success: true, count: products.length });
  } catch (error) {
    console.error("RECALC_ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
