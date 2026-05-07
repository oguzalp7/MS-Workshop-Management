import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get("workshopId");

    const where: any = {};
    if (workshopId) where.workshopId = workshopId;

    const configs = await prisma.printConfig.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ configs });

  } catch (error) {
    console.error("PRINT_CONFIG_FETCH_ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn || !session.adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, elements, canvasSettings, isDefault, workshopId } = body;

    const config = await prisma.printConfig.upsert({
      where: { name },
      update: {
        elements,
        canvasSettings,
        workshopId: workshopId || null,
        isDefault: isDefault || false,
        updatedById: session.adminId
      },
      create: {
        name,
        elements,
        canvasSettings,
        workshopId: workshopId || null,
        isDefault: isDefault || false,
        createdById: session.adminId,
        updatedById: session.adminId
      },
    });

    return NextResponse.json({ config });

  } catch (error) {
    console.error("PRINT_CONFIG_SAVE_ERROR:", error);
    return NextResponse.json({ 
      error: "Failed to save template", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

