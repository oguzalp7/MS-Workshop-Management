import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";
import * as bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if any admin exists
  const adminCount = await prisma.admin.count();

  if (adminCount === 0) {
    const username = process.env.DEFAULT_ADMIN_USERNAME || "admin";
    const password = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const name = process.env.DEFAULT_ADMIN_NAME || "System Administrator";

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        name,
        createdById: "System",
        updatedById: "System",
      },
    });

    console.log(`✅ Default admin created: ${admin.username} (${admin.name})`);
  } else {
    console.log(`ℹ️  ${adminCount} admin(s) already exist. Skipping seed.`);
  }
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
