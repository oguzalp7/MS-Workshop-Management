import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workshopId } = await params;
    const body = await request.json();
    const { initialQuantity = 0 } = body;

    // 1. Fetch all active products
    const activeProducts = await prisma.product.findMany({
      where: { active: true },
      select: { id: true }
    });

    // 3. Upsert stock entries for ALL active products
    await Promise.all(activeProducts.map(p => 
      prisma.workshopStock.upsert({
        where: {
          workshopId_productId: { workshopId, productId: p.id }
        },
        update: {
          quantity: initialQuantity,
          updatedById: session.adminId!,
        },
        create: {
          workshopId,
          productId: p.id,
          quantity: initialQuantity,
          active: true,
          createdById: session.adminId!,
          updatedById: session.adminId!,
        }
      })
    ));

    return NextResponse.json({ success: true, count: activeProducts.length });
  } catch (error) {
    console.error("Stock initialization error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
