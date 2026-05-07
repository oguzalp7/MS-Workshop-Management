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

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories fetch error:", error);
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
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        createdById: session.adminId,
        updatedById: session.adminId,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Category creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
