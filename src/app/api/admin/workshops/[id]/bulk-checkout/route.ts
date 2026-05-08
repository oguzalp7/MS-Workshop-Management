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

    if (!session.isLoggedIn || !session.adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workshopId } = await params;
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // 1. Find all eligible carts
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
      include: { items: true }
    });

    if (carts.length === 0) {
      return NextResponse.json({ error: "No orders found to checkout" }, { status: 404 });
    }

    // 2. Process all in a transaction
    await prisma.$transaction(async (tx) => {
      for (const cart of carts) {
        // Decrement stock for each item
        for (const item of cart.items) {
          await tx.workshopStock.update({
            where: {
              workshopId_productId: {
                workshopId,
                productId: item.productId
              }
            },
            data: {
              quantity: { decrement: item.quantity }
            }
          });
        }

        // Update cart status
        await tx.cart.update({
          where: { id: cart.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            updatedById: session.adminId
          }
        });

        // Notifications (Only if registered guest)
        if (cart.guestId) {
          await tx.notification.create({
            data: {
              guestId: cart.guestId,
              title: "✨ Siparişiniz Teslim Edildi",
              message: "Güzel günlerde kullanın! Sevgilerle... ❣️",
              type: "info"
            }
          });

          // Send Push
          const guest = await tx.guest.findUnique({ where: { id: cart.guestId } });
          if (guest && (guest as any).pushSubscription) {
            const { sendPushNotification } = await import("@/lib/webpush");
            await sendPushNotification((guest as any).pushSubscription, {
              title: "✨ Siparişiniz Teslim Edildi",
              body: "Güzel günlerde kullanın! Sevgilerle... ❣️",
              url: "/workshop/profile"
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true, count: carts.length });

  } catch (error) {
    console.error("Bulk checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
