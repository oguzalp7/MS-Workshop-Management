import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn || !session.adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get("workshopId");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      status: { not: "OPEN" },
      active: true,
    };

    // Construct guest filter
    const guestFilter: any = {};
    if (workshopId) guestFilter.workshopId = workshopId;

    if (search || (status && status !== 'all') || startDate || endDate) {
      guestFilter.workshop = {
        ...(status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {}),
        ...(startDate || endDate ? {
          startDateTime: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          }
        } : {}),
      };

      if (search) {
        where.OR = [
          // Workshop name/location
          { guest: { workshop: { name: { contains: search, mode: 'insensitive' } } } },
          { guest: { workshop: { location: { contains: search, mode: 'insensitive' } } } },
          // Guest name (from profileData JSON)
          { guest: { profileData: { path: ['full_name'], string_contains: search } } },
          // Product names in items
          { items: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } }
        ];
      }
    }

    if (Object.keys(guestFilter).length > 0) {
      where.guest = {
        ...where.guest,
        ...guestFilter
      };
    }

    const orders = await prisma.cart.findMany({
      where,
      include: {
        guest: {
          include: {
            workshop: {
              select: { name: true }
            }
          }
        },
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
