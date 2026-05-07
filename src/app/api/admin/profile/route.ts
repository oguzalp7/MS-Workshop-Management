import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn || !session.adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        username: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn || !session.adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, password } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No data to update" }, { status: 400 });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: session.adminId },
      data: updateData,
    });

    // Update session data if name changed
    if (name) {
      session.name = name;
      await session.save();
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedAdmin.id,
        username: updatedAdmin.username,
        name: updatedAdmin.name,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
