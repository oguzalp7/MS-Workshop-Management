import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── PATCH: Update admin user ─────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, active } = body;

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedById: session.adminId,
    };

    if (name !== undefined) updateData.name = name;
    if (active !== undefined) updateData.active = active;

    const admin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        active: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Update admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft-delete admin user ───────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.adminId) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.update({
      where: { id },
      data: {
        active: false,
        updatedById: session.adminId,
      },
      select: {
        id: true,
        username: true,
        name: true,
        active: true,
      },
    });

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
