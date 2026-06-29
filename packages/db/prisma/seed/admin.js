// @ts-check
import { prisma } from "../../prisma.client.js";
import bcrypt from "bcrypt";

export async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@aya.academy";
  // Fail closed: never ship a hardcoded admin password. Set SEED_ADMIN_PASSWORD
  // in the (gitignored) packages/db/.env before seeding.
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!rawPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required to seed the admin user. " +
        "Set it in packages/db/.env (it is gitignored).",
    );
  }
  const passwordHash = bcrypt.hashSync(rawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "مدير الأكاديمية",
      passwordHash,
      role: "ADMIN",
      locale: "ar",
      isActive: true,
    },
  });

  console.log(`[seed] admin user — id=${admin.id} email=${admin.email}`);
  return admin;
}

