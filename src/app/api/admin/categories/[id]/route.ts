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
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            price: true,
            media: true, // Updated to media
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Category fetch error:", error);
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
    const { name, active, connectProduct, disconnectProduct } = body;

    const data: any = {
      updatedById: session.adminId,
    };
    
    if (name !== undefined) data.name = name.trim();
    if (active !== undefined) data.active = active;
    
    if (connectProduct) {
      data.products = { connect: { id: connectProduct } };
    }
    if (disconnectProduct) {
      data.products = { disconnect: { id: disconnectProduct } };
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data,
      include: {
        products: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            price: true,
            media: true, // Updated to media
          },
          orderBy: { name: "asc" },
        }
      }
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error("Category update error:", error);
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

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Category deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
