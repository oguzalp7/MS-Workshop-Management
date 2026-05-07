import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [workshopCount, guestCount, openCartCount, productCount, revenueData] = await Promise.all([
      prisma.workshop.count({ where: { active: true } }),
      prisma.guest.count(),
      prisma.cart.count({ where: { status: "OPEN" } }),
      prisma.product.count({ where: { active: true } }),
      prisma.cart.aggregate({
        where: { 
          status: "PAID",
          active: true
        },
        _sum: { totalAmount: true }
      })
    ]);

    return NextResponse.json({
      stats: {
        activeWorkshops: workshopCount,
        totalGuests: guestCount,
        openCarts: openCartCount,
        totalProducts: productCount,
        totalRevenue: revenueData._sum.totalAmount || 0
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
