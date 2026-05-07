import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to evaluate simple math formulas
function evaluateFormula(formula: string, data: Record<string, any>) {
  try {
    // Replace [key] with actual value
    let expression = formula.replace(/\[(.*?)\]/g, (match, key) => {
      const val = data[key];
      return val !== undefined && val !== "" ? val : "0";
    });

    // Basic safety check: only numbers, operators, and parentheses
    if (/[^0-9\+\-\*\/\.\(\)\s]/.test(expression)) {
      return "Error: Invalid Formula";
    }

    // Use Function constructor for a simple, isolated evaluation
    // In a real production env, use a math parser library like mathjs
    return Number(new Function(`return ${expression}`)().toFixed(2));
  } catch (e) {
    return "Error";
  }
}

async function processFormLogic(workshopId: string, profileData: any) {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    include: { formConfig: true }
  });

  if (!workshop?.formConfig) return profileData;

  const fields = (workshop.formConfig.fields as any[]) || [];
  const updatedData = { ...profileData };

  // Calculate formulas
  fields.forEach(field => {
    if (field.type === "formula" && field.formula) {
      updatedData[field.key] = evaluateFormula(field.formula, updatedData);
    }
  });

  return updatedData;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workshopId } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const key = searchParams.get("key") || "";

    const where: any = { workshopId };
    if (query && key) {
      where.profileData = { path: [key], string_contains: query };
    }

    const guests = await prisma.guest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ guests });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn || !session.adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workshopId } = await params;
    const { profileData } = await request.json();

    // PROCESS FORMULAS BEFORE SAVING
    const processedData = await processFormLogic(workshopId, profileData);

    const guest = await prisma.guest.create({
      data: {
        workshopId,
        profileData: processedData,
        createdById: session.adminId,
        updatedById: session.adminId,
      },
    });

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Guest creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
