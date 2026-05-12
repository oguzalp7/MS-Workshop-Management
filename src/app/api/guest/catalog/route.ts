import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { guestSessionOptions, GuestSessionData } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<GuestSessionData>(cookieStore, guestSessionOptions);
    const sessionTokenFromCookie = request.cookies.get("workshop_session_token")?.value;
    let sessionToken = sessionTokenFromCookie;
    let reclaimedSessionToken = null;

    // Resilience: Re-claim session if cookie is lost but iron-session exists
    if (!sessionToken && session.shortCode && session.workshopId) {
      const existingGuest = await prisma.guest.findFirst({
        where: { shortCode: session.shortCode, workshopId: session.workshopId }
      });
      if (existingGuest?.sessionToken) {
        sessionToken = existingGuest.sessionToken;
        reclaimedSessionToken = sessionToken;
      }
    }

    let workshopId = session.workshopId;
    if (!workshopId && sessionToken) {
       const lastCart = await prisma.cart.findFirst({
         where: { sessionToken, status: 'OPEN' },
         select: { workshopId: true }
       });
       if (lastCart && lastCart.workshopId) workshopId = lastCart.workshopId;
    }

    if (!session.isLoggedIn && !workshopId) {
      console.warn("[Catalog API] Unauthorized:", { 
        isLoggedIn: session.isLoggedIn, 
        workshopId,
        hasToken: !!sessionToken
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const effectiveWorkshopId = workshopId || session.workshopId;
    if (!effectiveWorkshopId) return NextResponse.json({ error: "Workshop context lost" }, { status: 400 });


    // Fetch all active products and include stock for this workshop
    const [allProducts, priceTiers, reservations] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        include: {
          categories: { select: { name: true } },
          tieredPrices: { include: { priceTier: true } },
          workshopStock: {
            where: { workshopId: effectiveWorkshopId }
          }
        },
        orderBy: { name: "asc" }
      }),
      prisma.priceTier.findMany({ where: { active: true, softDeleted: false }, orderBy: { name: "asc" } }),
      prisma.cartItem.groupBy({
        by: ['productId'],
        where: {
          cart: {
            workshopId: effectiveWorkshopId,
            status: { in: ['OPEN', 'ORDERED', 'PREPARING', 'READY'] },
            active: true
          }
        },
        _sum: { quantity: true }
      })
    ]);

    const reservationMap = Object.fromEntries(reservations.map(r => [r.productId, r._sum.quantity || 0]));

    const products = allProducts.map(p => ({
      ...p,
      category: (p as any).categories?.[0]?.name || null,
      availableQuantity: p.workshopStock?.[0]?.quantity || 0,
      reservedCount: reservationMap[p.id] || 0
    }));

    // Check if guest has already filled profile
    let needsProfile = true;
    if (sessionToken) {
       const guest = await prisma.guest.findUnique({
         where: { sessionToken }
       });
       if (guest && (guest.profileData as any)?.full_name) {
         needsProfile = false;
       }
    }

    // Fetch settings
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ["catalog_logo", "catalog_welcome_title", "catalog_welcome_body"] }
      }
    });

    const getSetting = (key: string, def: string) => settings.find(s => s.key === key)?.value || def;

    // Fetch form configuration for this workshop
    const workshopWithForm = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        formConfig: true
      }
    });

    const formFields = (workshopWithForm?.formConfig?.fields as any) || [];

    const response = NextResponse.json({ 
      products, 
      priceTiers, 
      needsProfile,
      formFields,
      settings: {
        logo: getSetting("catalog_logo", "https://www.sglam.co/idea/qj/01/themes/selftpl_67f8b306e318e/assets/uploads/logo.png"),
        title: getSetting("catalog_welcome_title", "S'Glam E-Katalog'a Hoş Geldiniz!"),
        body: getSetting("catalog_welcome_body", "Size daha iyi hizmet verebilmek ve siparişlerinizi isminizle hazırlayabilmek için adınızı paylaşır mısınız?"),
      }
    });

    if (reclaimedSessionToken) {
      response.cookies.set("workshop_session_token", reclaimedSessionToken, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
      });
    }

    return response;

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
