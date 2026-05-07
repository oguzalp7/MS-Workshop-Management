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
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: { select: { id: true, name: true } },
        tieredPrices: { include: { priceTier: true } }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const { id } = await params;
    const body = await request.json();
    const { name, price, description, active, media, connectCategory, disconnectCategory, tieredPrices } = body;

    const data: any = {
      updatedById: session.adminId,
    };

    if (name !== undefined) data.name = name;
    if (price !== undefined) data.price = parseFloat(price);
    if (description !== undefined) data.description = description;
    if (active !== undefined) data.active = active;
    if (media !== undefined) data.media = media;

    if (connectCategory) {
      data.categories = { connect: { id: connectCategory } };
    }
    if (disconnectCategory) {
      data.categories = { disconnect: { id: disconnectCategory } };
    }

    if (tieredPrices) {
      // Handle tiered price updates/creations
      for (const [tierId, tierPrice] of Object.entries(tieredPrices)) {
        await prisma.productPrice.upsert({
          where: {
            productId_priceTierId: {
              productId: id,
              priceTierId: tierId
            }
          },
          update: { price: parseFloat(tierPrice as string) },
          create: {
            productId: id,
            priceTierId: tierId,
            price: parseFloat(tierPrice as string)
          }
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
      include: {
        categories: { select: { id: true, name: true } },
        tieredPrices: { include: { priceTier: true } }
      }
    });


    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const { id } = await params;

    // Check if product is used in any workshop stocks
    const inStock = await prisma.workshopStock.count({
      where: { productId: id }
    });

    if (inStock > 0) {
      return NextResponse.json({ error: "Cannot delete product used in workshops. Deactivate it instead." }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Product deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
