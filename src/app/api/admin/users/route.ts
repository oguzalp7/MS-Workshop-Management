import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ─── GET: List all admin users ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        updatedById: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("List admins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST: Create new admin user ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, password, name } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: "Username, password, and name are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await prisma.admin.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        name,
        createdById: session.adminId,
        updatedById: session.adminId,
      },
      select: {
        id: true,
        username: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
