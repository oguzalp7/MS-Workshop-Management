import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export async function seedAdmin() {
  try {
    const adminCount = await prisma.admin.count();

    if (adminCount === 0) {
      console.log("[Seed] No admin users found. Creating default admin...");

      const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
      const defaultName = process.env.DEFAULT_ADMIN_NAME || "System Administrator";

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      await prisma.admin.create({
        data: {
          username: defaultUsername,
          password: hashedPassword,
          name: defaultName,
        },
      });

      console.log(`[Seed] Default admin created successfully. Username: ${defaultUsername}`);
    } else {
      console.log(`[Seed] Admin user(s) already exist (${adminCount}). Skipping default admin creation.`);
    }
  } catch (error) {
    console.error("[Seed] Failed to seed default admin:", error);
  }
}
