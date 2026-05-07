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
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        workshop: {
          select: {
            id: true,
            name: true,
            formConfig: {
              select: { fields: true }
            }
          }
        },
        carts: {
          include: {
            priceTier: { select: { name: true } },
            items: {
              include: {
                product: {
                  select: { id: true, name: true, price: true, media: true }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });


    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Guest fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
