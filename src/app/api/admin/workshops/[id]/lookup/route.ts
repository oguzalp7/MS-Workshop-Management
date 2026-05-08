import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn || !session.adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workshopId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    console.log(`[Lookup API] Scanning for token: ${token} in workshop: ${workshopId}`);

    // Find all unpaid carts for this guest or session in this workshop
    const carts = await prisma.cart.findMany({
      where: {
        workshopId,
        active: true,
        status: { in: ['ORDERED', 'PREPARING', 'READY'] },
        OR: [
          { guestId: token },
          { sessionToken: token }
        ]
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, price: true }
            }
          }
        },
        priceTier: {
          select: { name: true }
        },
        guest: {
          select: { profileData: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (carts.length === 0) {
      console.log(`[Lookup API] No carts found for token: ${token}`);
      return NextResponse.json({ error: "No unpaid orders found for this guest" }, { status: 404 });
    }

    console.log(`[Lookup API] Found ${carts.length} carts for token: ${token}. Statuses: ${carts.map(c => c.status).join(', ')}`);

    const totalAmount = carts.reduce((sum, cart) => sum + (cart.totalAmount || 0), 0);
    const guestName = carts[0].guest?.profileData?.full_name || "Anonim Misafir";

    return NextResponse.json({ 
      carts, 
      totalAmount,
      guestName,
      token
    });

  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
