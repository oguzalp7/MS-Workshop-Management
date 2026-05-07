import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<GuestSessionData>(request, new NextResponse(), guestSessionOptions);

    if (!session.isLoggedIn || !session.guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guest = await prisma.guest.findUnique({
      where: { id: session.guestId },
      select: { workshopId: true }
    });

    const [individualNotifications, globalNotifications] = await Promise.all([
      prisma.notification.findMany({
        where: { guestId: session.guestId },
        orderBy: { createdAt: "desc" }
      }),
      prisma.globalNotification.findMany({
        where: { 
          OR: [
            { workshopId: guest?.workshopId },
            { workshopId: null }
          ]
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Map global notifications to the same format as individual ones
    const mappedGlobal = globalNotifications.map(n => ({
      id: n.id,
      title: n.type === "warning" ? "⚠️ Duyuru" : "📣 Duyuru",
      message: n.message,
      type: n.type,
      createdAt: n.createdAt,
      read: true 
    }));

    const notifications = [...individualNotifications, ...mappedGlobal].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Mark all individual notifications as read
    await prisma.notification.updateMany({
      where: { guestId: session.guestId, read: false },
      data: { read: true }
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
