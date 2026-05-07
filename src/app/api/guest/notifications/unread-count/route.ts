import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<GuestSessionData>(request, new NextResponse(), guestSessionOptions);

    if (!session.isLoggedIn || !session.guestId) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.notification.count({
      where: {
        guestId: session.guestId,
        read: false
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ count: 0 });
  }
}
