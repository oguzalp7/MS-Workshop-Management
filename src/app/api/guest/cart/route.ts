import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";
import { cookies } from "next/headers";

// GET current cart
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);
    const sessionToken = request.cookies.get("workshop_session_token")?.value;

    let workshopId = session.workshopId;
    if (!workshopId && sessionToken) {
       const lastCart = await prisma.cart.findFirst({
         where: { sessionToken, status: 'OPEN' },
         select: { workshopId: true }
       });
       if (lastCart && lastCart.workshopId) workshopId = lastCart.workshopId;
    }

    if (!session.isLoggedIn && !workshopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const effectiveWorkshopId = workshopId || session.workshopId;
    
    // Find the latest OPEN cart for this guest or anonymous session
    const cart = await prisma.cart.findFirst({
      where: {
        status: "OPEN",
        active: true,
        OR: [
          session.guestId ? { guestId: session.guestId } : { sessionToken, workshopId: effectiveWorkshopId }
        ]
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, media: true, tieredPrices: true }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// POST add item to cart
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);
    if (!session.isLoggedIn || !session.workshopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, quantity } = await request.json();
    const sessionToken = request.cookies.get("workshop_session_token")?.value;

    // 1. Get or create OPEN cart
    let cart = await prisma.cart.findFirst({
      where: {
        status: "OPEN",
        active: true,
        OR: [
          session.guestId ? { guestId: session.guestId } : { sessionToken, workshopId: session.workshopId }
        ]
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          guestId: session.guestId || null,
          workshopId: session.workshopId,
          sessionToken: session.guestId ? null : sessionToken,
          status: "OPEN",
          createdById: "GUEST",
          updatedById: "GUEST"
        }
      });
    }

    // 2. Check if product already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          createdById: "GUEST",
          updatedById: "GUEST"
        }
      });
    }


    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// PATCH update quantity
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);
    if (!session.isLoggedIn || !session.workshopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId, quantity } = await request.json();
    const sessionToken = request.cookies.get("workshop_session_token")?.value;

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });
    }

    // Return the updated cart
    const updatedCart = await prisma.cart.findFirst({
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
              select: { id: true, name: true, price: true, media: true, tieredPrices: true }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return NextResponse.json({ cart: updatedCart });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
