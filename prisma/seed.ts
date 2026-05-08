import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";
import * as bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database for testing...");

  // 1. Create Default Admin
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Sistem Yöneticisi",
      createdById: "system",
      updatedById: "system",
    },
  });
  console.log("✅ Admin created/verified");

  // 2. Create Price Tiers (Nakit & Kredi Kartı)
  const nakit = await prisma.priceTier.upsert({
    where: { name: "Nakit" },
    update: {},
    create: {
      name: "Nakit",
      surchargePercentage: -23.0,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  const kart = await prisma.priceTier.upsert({
    where: { name: "Kredi Kartı" },
    update: {},
    create: {
      name: "Kredi Kartı",
      surchargePercentage: -20.0,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });
  console.log("✅ Price tiers created (Nakit -%23, Kart -%20)");

  // 3. Create Categories
  const catNames = ["BB Krem", "Glitter", "Highlighter", "Fondoten", "Dudak", "EyeLiner"];
  const categories = await Promise.all(
    catNames.map(name =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: {
          name,
          createdById: admin.id,
          updatedById: admin.id,
        }
      })
    )
  );
  console.log(`✅ ${categories.length} categories created`);

  // 4. Create Products
  const products = [
    // BB Creams
    {
      name: "BB Cream - Light", price: 499, catIdx: 0, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1800/prod/QC_ENRICHMENT/20251219/02/72e1ff38-da29-3e56-99f1-8961b51b515c/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1815/prod/QC_ENRICHMENT/20260123/20/5afa66b7-1973-3fc2-835b-aaba47533239/1_org_zoom.jpg", type: "image" },
        { url: "https://video-content.dsmcdn.com/prod/720p/2018925/2030889/2026901/87102d29-d9e4-4513-8476-7106ea9334aa.mp4", type: "video" },
      ]
    },
    {
      name: "BB Cream - Medium", price: 499, catIdx: 0, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1800/prod/QC_ENRICHMENT/20251219/02/39d63a7f-e2a9-3a35-a491-eea7ad2d2d6a/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1815/prod/QC_ENRICHMENT/20260123/20/5afa66b7-1973-3fc2-835b-aaba47533239/1_org_zoom.jpg", type: "image" },
        { url: "https://video-content.dsmcdn.com/prod/720p/2018925/2030889/2026901/87102d29-d9e4-4513-8476-7106ea9334aa.mp4", type: "video" },
      ]
    },
    {
      name: "BB Cream - Bronz", price: 499, catIdx: 0, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1800/prod/QC_ENRICHMENT/20251219/02/39d63a7f-e2a9-3a35-a491-eea7ad2d2d6a/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1815/prod/QC_ENRICHMENT/20260123/20/5afa66b7-1973-3fc2-835b-aaba47533239/1_org_zoom.jpg", type: "image" },
        { url: "https://video-content.dsmcdn.com/prod/720p/2018925/2030889/2026901/87102d29-d9e4-4513-8476-7106ea9334aa.mp4", type: "video" },
      ]
    },
    {
      name: "BB Cream - Extra Light", price: 499, catIdx: 0, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1800/prod/QC_ENRICHMENT/20251219/02/39d63a7f-e2a9-3a35-a491-eea7ad2d2d6a/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1815/prod/QC_ENRICHMENT/20260123/20/5afa66b7-1973-3fc2-835b-aaba47533239/1_org_zoom.jpg", type: "image" },
        { url: "https://video-content.dsmcdn.com/prod/720p/2018925/2030889/2026901/87102d29-d9e4-4513-8476-7106ea9334aa.mp4", type: "video" },
      ]
    },

    // Glitters
    {
      name: "Glitter White", price: 429, catIdx: 1, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1815/prod/QC_ENRICHMENT/20260123/18/236251d4-4497-38a3-b8d5-4d82d3beb9a2/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Glitter Diamond", price: 529, catIdx: 1, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1817/prod/QC_ENRICHMENT/20260123/19/78daf95f-b076-3873-8373-e7c78665e34e/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1818/prod/QC_ENRICHMENT/20260130/00/9f7a5aa6-a2e0-3c37-93d0-2653ea906274/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Glitter Gold", price: 429, catIdx: 1, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1816/prod/QC_ENRICHMENT/20260123/19/62a30742-566a-3b89-8ac7-833935e3994d/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Glitter Soft Pink", price: 429, catIdx: 1, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1785/prod/QC_ENRICHMENT/20251111/16/1cc075c7-9cc2-3b86-928e-d0eb7b03c20b/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1786/prod/QC_ENRICHMENT/20251111/16/0f6aff2b-2a97-3329-9f2d-9d1de3527dd2/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1786/prod/QC_PREP/20251110/12/86685c83-afad-3e1e-b2d6-3ccc8ae6423f/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Glitter White Diamond", price: 529, catIdx: 1, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1819/prod/QC_ENRICHMENT/20260130/00/07536827-2e52-3d15-aae7-5bac932cc8db/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Glitter Pink", price: 429, catIdx: 1, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1785/prod/QC_ENRICHMENT/20251111/16/366974e1-3c9a-3c64-8aaa-3a4514293d93/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1785/prod/QC_ENRICHMENT/20251110/14/2f550f06-a2cd-342d-9e66-384cfbddaced/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Glitter Rose", price: 429, catIdx: 1, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1817/prod/QC_ENRICHMENT/20260128/22/e6734d7f-8448-36a8-a03b-1803655e4ba4/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Glitter Black", price: 429, catIdx: 1, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1815/prod/QC_ENRICHMENT/20260123/19/1a67ea1b-a658-3da7-a97d-ac1adbc7b478/1_org_zoom.jpg", type: "image" },
      ]
    },

    // Highlighters
    {
      name: "4 Color Highlighter Palette", price: 599, catIdx: 2, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1614/prod/QC/20241222/20/975a392d-8356-3286-8715-5cc6f012021c/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1614/prod/QC/20241222/20/1d25b525-b91c-3096-993f-2208e4fe331d/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1616/prod/QC/20241222/20/d66e1a2e-2b6f-3be2-9de9-4663951c9ba1/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1616/prod/QC/20241222/20/312ef466-ee82-379b-b3e0-043edd37596b/1_org_zoom.jpg", type: "image" },
      ]
    },

    // Foundations
    {
      name: "Foundation Light", price: 529, catIdx: 3, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1805/prod/QC_ENRICHMENT/20251222/17/53e767c9-8069-3eeb-b45a-fec1383386e5/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1819/prod/QC_ENRICHMENT/20260129/17/553679cb-0c41-318f-a9b1-a9bee8ab2e7f/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1819/prod/QC_ENRICHMENT/20260129/17/f3b95406-50f9-3137-862b-066461c91056/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1818/prod/QC_ENRICHMENT/20260129/17/1b7b6b83-02c8-3820-b7ae-7ebc259c3f00/1_org_zoom.jpg", type: "image" },
        { url: "https://video-content.dsmcdn.com/prod/720p/2019922/2020919/2048835/8a741ba6-577e-4d3c-99ee-11f06d7f3a1e.mp4", type: "video" },
      ]
    },
    {
      name: "Foundation Medium", price: 529, catIdx: 3, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1805/prod/QC_ENRICHMENT/20251222/18/99e5cd46-54e2-3e56-974c-60a8ef39679a/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1819/prod/QC_ENRICHMENT/20260129/17/f3b95406-50f9-3137-862b-066461c91056/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1819/prod/QC_ENRICHMENT/20260129/17/095ac168-3344-3cb7-b912-f4936dd897c1/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1818/prod/QC_ENRICHMENT/20260129/17/a8ef8822-d569-3715-bee2-81c055c91524/1_org_zoom.jpg", type: "image" },
        { url: "https://video-content.dsmcdn.com/prod/720p/2019922/2020919/2048835/8a741ba6-577e-4d3c-99ee-11f06d7f3a1e.mp4", type: "video" },
      ]
    },
    {
      name: "Foundation SPF 15", price: 529, catIdx: 3, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1804/prod/QC_ENRICHMENT/20251222/18/4072420f-3ea7-3951-9e19-f47216d52e81/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1819/prod/QC_ENRICHMENT/20260129/17/1f4feb9d-0990-3bf5-bdbb-7b39bc05cd57/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1819/prod/QC_ENRICHMENT/20260129/17/f3b95406-50f9-3137-862b-066461c91056/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1820/prod/QC_ENRICHMENT/20260129/17/c8ae4500-510f-30c9-9ad6-d18ad1ac576d/1_org_zoom.jpg", type: "image" },
        { url: "https://video-content.dsmcdn.com/prod/720p/2019922/2020919/2048835/8a741ba6-577e-4d3c-99ee-11f06d7f3a1e.mp4", type: "video" },
      ]
    },

    // Dudak
    {
      name: "Lipliner Pencil - Seven 777", price: 199, catIdx: 4, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1605/prod/QC/20241122/17/b01d38ae-8e5b-389d-bb19-3da8a5b84bf8/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1606/prod/QC/20241122/17/752cac28-a9b1-3aa2-821d-6f0bdf1d132e/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1605/prod/QC/20241122/17/7f0417f8-1248-317e-84b9-15b2a5e745b6/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Lipliner Pencil - Illusion", price: 199, catIdx: 4, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1766/prod/QC_ENRICHMENT/20250926/20/65ecb326-35dc-3a23-8b09-64d947c06afa/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1605/prod/QC/20241122/17/e7e1556d-52f0-3dfb-8d5b-5bb868eda3c0/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Lipliner Pencil - Upgrade", price: 199, catIdx: 4, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1818/prod/QC_ENRICHMENT/20260130/00/186229fc-2085-3356-b825-c79838474b66/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Lipliner Pencil - Winner", price: 199, catIdx: 4, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1604/prod/QC/20241116/12/2fa23803-3334-3ee7-b909-d58027e00f0c/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1604/prod/QC/20241116/12/475fbdcb-e41c-3a6a-84ba-98f9bd8ee875/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1602/prod/QC/20241116/12/88ce50a6-365e-3c07-baa4-63d49e860972/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Lipliner Pencil - Money", price: 199, catIdx: 4, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1765/prod/QC_ENRICHMENT/20250926/20/edcf5879-eaa8-3eff-a6b7-2aded0ba04ab/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1765/prod/QC_ENRICHMENT/20250926/20/0830d965-2724-3c6c-9963-63b77987554f/1_org_zoom.jpg", type: "image" },
      ]
    },
    {
      name: "Lipliner Pencil - Karma", price: 199, catIdx: 4, description: "", media: [
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1764/prod/QC_ENRICHMENT/20250926/20/a3ed41ef-465e-3358-9432-631a8e115814/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1766/prod/QC_ENRICHMENT/20250926/20/62987443-8ace-39a8-8ed3-6df9ba46e671/1_org_zoom.jpg", type: "image" },
        { url: "https://cdn.dsmcdn.com/mnresize/620/920/ty1764/prod/QC_ENRICHMENT/20250926/20/a110bb2b-aefa-3b9d-8300-42582b400fb7/1_org_zoom.jpg", type: "image" }
      ]
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          categories: {
            connect: [{ id: categories[p.catIdx].id }]
          },
          createdById: admin.id,
          description: p.description,
          media: p.media,
          updatedById: admin.id,
        }
      });
    }
  }
  console.log(`✅ ${products.length} products created`);

  // 5. Create Guest Blueprint (Form Config)
  const formConfig = await prisma.formConfig.create({
    data: {
      name: "Standart Kayıt Formu",
      fields: [
        { id: "f1", key: "full_name", label: "Ad Soyad", type: "text", required: true },
        { id: "f2", key: "phone", label: "Telefon", type: "text", required: true },
      ],
      createdById: admin.id,
      updatedById: admin.id,
    }
  });
  console.log("✅ Guest Blueprint created");

  // 6. Create Printing Template
  const printConfig = await prisma.printConfig.create({
    data: {
      name: "Standart Yaka Kartı",
      elements: [
        {
          "x": 154.71428571428572,
          "y": 37.142857142857146,
          "id": "41qearrac",
          "bold": false,
          "type": "qrcode",
          "color": "#000000",
          "label": "Magic QR Code",
          "fontSize": 40,
          "fontFamily": "'Inter', sans-serif"
        },
        {
          "x": 19.285714285714285,
          "y": 18,
          "id": "sfnpgaik9",
          "url": "https://placehold.co/400x200/EEE/31343C?text=Your+Logo",
          "bold": false,
          "type": "image",
          "color": "#000000",
          "label": "Logo / Image",
          "width": 40,
          "height": 20,
          "fontSize": 14,
          "fontFamily": "'Inter', sans-serif"
        },
        {
          "x": 69.28571428571429,
          "y": 26.571428571428573,
          "id": "l9ckyrklu",
          "bold": true,
          "type": "workshop_name",
          "color": "#000000",
          "label": "Automated Title",
          "fontSize": 14,
          "fontFamily": "'Inter', sans-serif"
        },
        {
          "x": 138.14285714285714,
          "y": 22.857142857142858,
          "id": "m6pdyb7uo",
          "bold": false,
          "type": "workshop_start",
          "color": "#000000",
          "label": "Event Start",
          "fontSize": 14,
          "fontFamily": "'Inter', sans-serif"
        },
        {
          "x": 32.714285714285715,
          "y": 65.42857142857143,
          "id": "obabb61ql",
          "key": "full_name",
          "bold": false,
          "type": "data",
          "color": "#000000",
          "label": "Ad Soyad",
          "fontSize": 14,
          "fontFamily": "'Inter', sans-serif"
        },
        {
          "x": 32.714285714285715,
          "y": 85.71428571428571,
          "id": "56b04bpdq",
          "key": "phone",
          "bold": false,
          "type": "data",
          "color": "#000000",
          "label": "Telefon",
          "fontSize": 14,
          "fontFamily": "'Inter', sans-serif"
        }
      ],
      canvasSettings: {
        "width": 210,
        "height": 297,
        "gridSize": 10,
        "showGrid": false,
        "backgroundColor": "#ffffff",
        "backgroundImage": ""
      },
      active: true,
      isDefault: true,
      createdById: admin.id,
      updatedById: admin.id,
    }
  });
  console.log("✅ Print Template created");

  // 7. Create a Sample Workshop
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const workshop = await prisma.workshop.create({
    data: {
      name: "Tanıtım ve Test Atölyesi",
      location: "Büyük Salon - Kat 1",
      description: "Bu atölye sistemi test etmek için otomatik olarak oluşturulmuştur.",
      startDateTime: tomorrow,
      endDateTime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000), // 8 hours later
      formConfigId: formConfig.id,
      printConfigId: printConfig.id,
      isAnonymous: true,
      active: true,
      createdById: admin.id,
      updatedById: admin.id,
    }
  });

  // 8. Initialize Stock for Workshop
  const allProducts = await prisma.product.findMany();
  await Promise.all(allProducts.map(p =>
    prisma.workshopStock.create({
      data: {
        workshopId: workshop.id,
        productId: p.id,
        quantity: 100,
        createdById: admin.id,
        updatedById: admin.id,
      }
    })
  ));

  console.log(`✅ Workshop "${workshop.name}" created with full stock!`);
  console.log("\n🚀 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
