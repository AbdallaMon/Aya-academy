// @ts-check
import { prisma } from "../../prisma.client.js";

// Seed the singleton global settings (hourly rate + currency) if absent.
export async function seedAppSettings() {
  const existing = await prisma.appSetting.findFirst();
  if (!existing) {
    await prisma.appSetting.create({
      data: { hourlyRate: 8.0, currency: "USD" },
    });
    console.log("[seed] app settings — created (8.00 USD)");
  }
}

