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

    let configs = await prisma.formConfig.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Seed a mock blueprint if none exist for demonstration
    if (configs.length === 0) {
      const mock = await prisma.formConfig.create({
        data: {
          name: "Standard Event Scoring",
          fields: [
            { id: "f1", key: "full_name", label: "Full Name", type: "text", required: true },
            { id: "f2", key: "base_score", label: "Base Score", type: "number", required: true },
            { id: "f3", key: "bonus_points", label: "Bonus Points", type: "number", required: false },
            { id: "f4", key: "total_result", label: "Total Result", type: "formula", formula: "[base_score] + [bonus_points]", required: false },
          ],
          createdById: session.adminId || "System",
          updatedById: session.adminId || "System",
        }
      });
      configs = [mock];
    }

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Config fetch error:", error);
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

    const { name, fields, id } = await request.json();

    const config = await prisma.formConfig.upsert({
      where: { id: id || "new-id" },
      update: {
        name,
        fields,
        updatedById: session.adminId,
      },
      create: {
        name,
        fields,
        createdById: session.adminId,
        updatedById: session.adminId,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Config save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
