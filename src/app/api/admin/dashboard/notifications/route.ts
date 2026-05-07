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

    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get("workshopId");

    const notifications = await prisma.globalNotification.findMany({
      where: workshopId ? { workshopId } : { workshopId: null },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn || !session.adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, type, workshopId } = await request.json();

    const notification = await prisma.globalNotification.create({
      data: {
        message,
        type: type || "info",
        workshopId: workshopId || null,
        createdById: session.adminId,
        updatedById: session.adminId,
      }
    });

    // ─── BROADCAST PUSH ──────────────────────────────────────────
    // Get guests with subscriptions, filtered by workshop if provided
    const guests = await prisma.guest.findMany({
      where: {
        pushSubscription: { not: null as any },
        ...(workshopId ? { workshopId } : {})
      },
      select: {
        id: true,
        pushSubscription: true
      }
    });

    const { sendPushNotification } = await import("@/lib/webpush");

    // Send in background (parallel)
    const welcomeTitleSetting = await prisma.setting.findUnique({ where: { key: "notif_welcome_title" } });
    const defaultTitle = welcomeTitleSetting?.value as string || "Workshop Duyurusu";

    Promise.all(guests.map(async (guest) => {
      const result = await sendPushNotification(guest.pushSubscription, {
        title: type === "warning" ? "⚠️ Dikkat" : defaultTitle,
        body: message,
        url: "/workshop/notifications"
      });

      // Cleanup expired subscriptions
      if (result?.error === "expired") {
        await prisma.guest.update({
          where: { id: guest.id },
          data: { pushSubscription: null as any }
        });
      }
    }));

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    await prisma.globalNotification.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
