import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  ORDERED: "Sipariş Alındı",
  PREPARING: "Hazırlanıyor",
  READY: "Teslime Hazır",
  PAID: "Tamamlandı / Ödendi"
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn || !session.adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: cartId } = await params;
    const { status } = await request.json();

    if (!STATUS_LABELS[status]) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // 1. Fetch the cart with guest and items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        guest: true,
        items: true
      }
    });

    if (!cart) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const updateData: any = {
      status,
      updatedById: session.adminId
    };

    // Set tracking timestamps
    if (status === "ORDERED") updateData.orderedAt = new Date();
    if (status === "PREPARING") updateData.preparedAt = new Date();
    if (status === "READY") updateData.readyAt = new Date();
    if (status === "PAID") updateData.paidAt = new Date();

    // 2. Perform Status Transition in Transaction
    const updatedCart = await prisma.$transaction(async (tx) => {
      // If transition to PAID, decrement stock
      if (status === "PAID" && cart.status !== "PAID") {
        for (const item of cart.items) {
          await tx.workshopStock.update({
            where: {
              workshopId_productId: {
                workshopId: cart.guest.workshopId,
                productId: item.productId
              }
            },
            data: {
              quantity: { decrement: item.quantity }
            }
          });
        }
      }

      return tx.cart.update({
        where: { id: cartId },
        data: updateData
      });
    });

    // 3. Side Effects: Notifications
    if (status === "READY" || status === "PAID") {
      // Fetch dynamic templates
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: [
              `notif_${status.toLowerCase()}_title`,
              `notif_${status.toLowerCase()}_body`
            ]
          }
        }
      });

      const getSetting = (key: string, def: string) => settings.find(s => s.key === key)?.value as string || def;

      const title = status === "READY"
        ? getSetting("notif_ready_title", "🎁 Siparişiniz Hazır!")
        : getSetting("notif_paid_title", "✨ Güle Güle Kullanın!");

      const message = status === "READY"
        ? getSetting("notif_ready_body", "Siparişiniz hazırlandı. Teslim almak için standımıza bekliyoruz. 💖")
        : getSetting("notif_paid_body", "Ödemeniz alındı, siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz! ❣️");

      // Save to Notification table
      await prisma.notification.create({
        data: {
          guestId: cart.guestId,
          title,
          message,
          type: status === "READY" ? "success" : "info"
        }
      });

      // Send Push Notification
      const guest = cart.guest as any;
      if (guest.pushSubscription) {
        const { sendPushNotification } = await import("@/lib/webpush");
        await sendPushNotification(guest.pushSubscription, {
          title,
          body: message,
          url: "/workshop/history"
        });
      }
    }

    return NextResponse.json({ cart: updatedCart });

  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
