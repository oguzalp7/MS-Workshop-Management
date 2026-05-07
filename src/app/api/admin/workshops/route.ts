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

    const workshops = await prisma.workshop.findMany({
      include: {
        _count: {
          select: { guests: true, inventory: true }
        }
      },
      orderBy: { startDateTime: "desc" },
    });

    return NextResponse.json({ workshops });
  } catch (error) {
    console.error("Workshop fetch error:", error);
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

    const body = await request.json();
    const { name, description, location, startDateTime, endDateTime } = body;

    const workshop = await prisma.workshop.create({
      data: {
        name,
        description,
        location,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        createdById: session.adminId,
        updatedById: session.adminId,
      },
    });

    return NextResponse.json({ workshop }, { status: 201 });
  } catch (error) {
    console.error("Workshop creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
