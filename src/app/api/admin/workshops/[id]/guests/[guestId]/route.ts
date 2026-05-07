import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to evaluate simple math formulas
function evaluateFormula(formula: string, data: Record<string, any>) {
  try {
    let expression = formula.replace(/\[(.*?)\]/g, (match, key) => {
      const val = data[key];
      return val !== undefined && val !== "" ? val : "0";
    });
    if (/[^0-9\+\-\*\/\.\(\)\s]/.test(expression)) return "Error";
    return Number(new Function(`return ${expression}`)().toFixed(2));
  } catch (e) { return "Error"; }
}

async function processFormLogic(workshopId: string, profileData: any) {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    include: { formConfig: true }
  });
  if (!workshop?.formConfig) return profileData;
  const fields = (workshop.formConfig.fields as any[]) || [];
  const updatedData = { ...profileData };
  fields.forEach(field => {
    if (field.type === "formula" && field.formula) {
      updatedData[field.key] = evaluateFormula(field.formula, updatedData);
    }
  });
  return updatedData;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, guestId: string }> }
) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn || !session.adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workshopId, guestId } = await params;
    const body = await request.json();
    const { checkInStatus, profileData } = body;

    let dataToUpdate: any = { updatedById: session.adminId };
    
    if (checkInStatus !== undefined) dataToUpdate.checkInStatus = checkInStatus;
    
    if (profileData) {
      // RE-CALCULATE FORMULAS ON PROFILE UPDATE
      const processedData = await processFormLogic(workshopId, profileData);
      dataToUpdate.profileData = processedData;
    }

    const guest = await prisma.guest.update({
      where: { id: guestId },
      data: dataToUpdate,
    });

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Guest update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, guestId: string }> }
) {
  try {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { guestId } = await params;
    await prisma.guest.delete({ where: { id: guestId } });
    return NextResponse.json({ message: "Guest removed" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
