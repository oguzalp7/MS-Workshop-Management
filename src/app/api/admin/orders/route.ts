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

    if (workshopId) {
      where.workshopId = workshopId;
    }

    if (search) {
      where.OR = [
        // Product names in items
        { items: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } },
        // Guest name or shortCode
        { guest: { profileData: { path: ['full_name'], string_contains: search } } },
        { guest: { shortCode: { contains: search, mode: 'insensitive' } } },
        // Workshop context
        { workshop: { name: { contains: search, mode: 'insensitive' } } },
        { workshop: { location: { contains: search, mode: 'insensitive' } } }
      ];
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
        workshop: {
          select: { name: true, location: true }
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
