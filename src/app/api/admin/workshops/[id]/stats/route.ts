import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workshopId } = await params;
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [guestCount, checkedInCount, openCartCount, inventoryCount, revenueData] = await Promise.all([
      prisma.guest.count({ where: { workshopId } }),
      prisma.guest.count({ where: { workshopId, checkInStatus: true } }),
      prisma.cart.count({ 
        where: { 
          guest: { workshopId },
          status: "OPEN" 
        } 
      }),
      prisma.workshopStock.count({ where: { workshopId } }),
      prisma.cart.aggregate({
        where: { 
          guest: { workshopId },
          status: "PAID",
          active: true
        },
        _sum: { totalAmount: true }
      })
    ]);

    return NextResponse.json({
      stats: {
        totalGuests: guestCount,
        checkedInGuests: checkedInCount,
        openCarts: openCartCount,
        totalProducts: inventoryCount,
        totalRevenue: revenueData._sum.totalAmount || 0
      }
    });
  } catch (error) {
    console.error("Workshop stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
