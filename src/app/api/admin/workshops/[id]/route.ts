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

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            product: {
              select: { id: true, name: true, price: true, media: true }
            }
          },
          orderBy: { product: { name: "asc" } }
        },
        guests: true,
        formConfig: true,
        printConfig: true
      }
    });


    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    return NextResponse.json({ workshop });
  } catch (error) {
    console.error("Workshop fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const { id } = await params;
    const body = await request.json();
    const { name, location, startDateTime, endDateTime, description, active, formConfigId, printConfigId, isAnonymous } = body;

    const workshop = await prisma.workshop.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(startDateTime && { startDateTime: new Date(startDateTime) }),
        ...(endDateTime && { endDateTime: new Date(endDateTime) }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active }),
        ...(formConfigId !== undefined && { formConfigId: formConfigId === "" ? null : formConfigId }),
        ...(printConfigId !== undefined && { printConfigId: printConfigId === "" ? null : printConfigId }),
        ...(isAnonymous !== undefined && { isAnonymous }),
        updatedById: session.adminId,
      },
    });


    return NextResponse.json({ workshop });
  } catch (error) {
    console.error("Workshop update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn || !session.adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.workshop.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Workshop deleted" });
  } catch (error) {
    console.error("Workshop deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

