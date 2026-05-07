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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const excludeCategoryId = searchParams.get("excludeCategory");

    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
        ...(excludeCategoryId ? {
          categories: {
            none: { id: excludeCategoryId }
          }
        } : {})
      },
      include: {
        categories: { select: { id: true, name: true } },
        tieredPrices: { include: { priceTier: true } }
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Product search error:", error);
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
    const { name, price, description, media, categories, tieredPrices } = body;
    const basePrice = parseFloat(price) || 0;

    // Fetch tiers to calculate defaults if needed
    const allTiers = await prisma.priceTier.findMany({ where: { active: true } });

    const product = await prisma.product.create({
      data: {
        name,
        price: basePrice,
        description: description || "",
        media: media || [],
        createdById: session.adminId,
        updatedById: session.adminId,
        categories: {
          connect: (categories || []).map((id: string) => ({ id }))
        },
        tieredPrices: {
          create: allTiers.map((tier) => {
            const override = tieredPrices?.[tier.id];
            const finalPrice = (override && parseFloat(override) > 0)
              ? parseFloat(override)
              : (basePrice * (1 + (tier.surchargePercentage / 100)));

            return {
              priceTierId: tier.id,
              price: finalPrice
            };
          })
        }
      },
      include: {
        categories: true,
        tieredPrices: true
      }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
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

    const { updates } = await request.json(); // Array of {id, name, price, active}

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates must be an array" }, { status: 400 });
    }

    // Perform updates in a transaction
    const results = await prisma.$transaction(
      updates.map((u: any) =>
        prisma.product.update({
          where: { id: u.id },
          data: {
            ...(u.name !== undefined && { name: u.name }),
            ...(u.price !== undefined && { price: parseFloat(u.price) }),
            ...(u.active !== undefined && { active: u.active }),
            ...(u.tieredPrices !== undefined && {
              tieredPrices: {
                upsert: Object.entries(u.tieredPrices).map(([tierId, price]: [string, any]) => ({
                  where: {
                    productId_priceTierId: {
                      productId: u.id,
                      priceTierId: tierId
                    }
                  },
                  create: {
                    priceTierId: tierId,
                    price: parseFloat(price)
                  },
                  update: {
                    price: parseFloat(price)
                  }
                }))
              }
            }),
            updatedById: session.adminId!,
          },
        })
      )
    );


    return NextResponse.json({ products: results });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

