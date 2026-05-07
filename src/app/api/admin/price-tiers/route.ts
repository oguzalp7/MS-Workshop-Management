import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tiers = await prisma.priceTier.findMany({
      where: { softDeleted: false },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ tiers });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, surchargePercentage } = body;

    const tier = await prisma.priceTier.create({
      data: {
        name,
        surchargePercentage: parseFloat(surchargePercentage) || 0,
        createdById: session.adminId,
        updatedById: session.adminId
      }
    });

    // Auto-calculate prices for all products for this new tier
    const products = await prisma.product.findMany({ select: { id: true, price: true } });
    const productPricesData = products.map(p => ({
      productId: p.id,
      priceTierId: tier.id,
      price: p.price * (1 + (tier.surchargePercentage / 100))
    }));

    if (productPricesData.length > 0) {
      await prisma.productPrice.createMany({
        data: productPricesData
      });
    }

    return NextResponse.json({ tier });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getIronSession<SessionData>(request, new NextResponse(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, name, surchargePercentage, active, softDeleted } = body;

    const currentTier = await prisma.priceTier.findUnique({ where: { id } });
    if (!currentTier) return NextResponse.json({ error: "Tier not found" }, { status: 404 });

    const updatedTier = await prisma.priceTier.update({
      where: { id },
      data: {
        name,
        surchargePercentage: surchargePercentage !== undefined ? parseFloat(surchargePercentage) : undefined,
        active,
        softDeleted,
        updatedById: session.adminId
      }
    });

    // If surcharge changed, we might want to trigger a recalculation (handled by separate POST usually, but we can do it here too if requested)
    // For now, let's just return the updated tier.

    return NextResponse.json({ tier: updatedTier });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
