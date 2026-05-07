import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<GuestSessionData>(request, new NextResponse(), guestSessionOptions);

    if (!session.isLoggedIn || !session.guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await request.json();

    await prisma.guest.update({
      where: { id: session.guestId },
      data: { pushSubscription: subscription } as any
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
