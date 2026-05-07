import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Single Stock Update
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
    const { productId, quantity } = await request.json();

    const stock = await prisma.workshopStock.upsert({
      where: {
        workshopId_productId: { workshopId, productId }
      },
      update: {
        quantity: parseInt(quantity),
        updatedById: session.adminId,
      },
      create: {
        workshopId,
        productId,
        quantity: parseInt(quantity),
        createdById: session.adminId,
        updatedById: session.adminId,
      },
    });

    return NextResponse.json({ stock });
  } catch (error) {
    console.error("Stock update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Single Stock Removal
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

    const { id: workshopId } = await params;
    const { productId } = await request.json();

    await prisma.workshopStock.delete({
      where: {
        workshopId_productId: { workshopId, productId }
      }
    });

    return NextResponse.json({ message: "Stock removed" });
  } catch (error) {
    console.error("Stock removal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Bulk update stock levels
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

    const { id: workshopId } = await params;
    const { updates } = await request.json(); // Array of {productId, quantity}

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates must be an array" }, { status: 400 });
    }

    const results = await prisma.$transaction(
      updates.map((u: any) =>
        prisma.workshopStock.upsert({
          where: {
            workshopId_productId: { workshopId, productId: u.productId }
          },
          update: {
            quantity: parseInt(u.quantity),
            updatedById: session.adminId!,
          },
          create: {
            workshopId,
            productId: u.productId,
            quantity: parseInt(u.quantity),
            createdById: session.adminId!,
            updatedById: session.adminId!,
          },
        })
      )
    );

    return NextResponse.json({ stock: results });
  } catch (error) {
    console.error("Bulk stock update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
