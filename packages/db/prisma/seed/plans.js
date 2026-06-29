// @ts-check
import { prisma } from "../../prisma.client.js";

export async function seedPlans() {
  // A plan stores ONLY its hours. The price is derived from the single global
  // hourly rate (AppSetting.hourlyRate): monthly = hours × rate, yearly = ×12.
  const planDefs = [
    {
      titleAr: "الباقة التمهيدية",
      titleEn: "Starter",
      descriptionAr: "٤ ساعات شهريًا — مثالية للبداية واكتشاف المنصّة.",
      descriptionEn: "4 hours per month — perfect to start and explore.",
      hours: 4,
      isFeatured: false,
      sortOrder: 1,
    },
    {
      titleAr: "الباقة المتوازنة",
      titleEn: "Standard",
      descriptionAr: "٨ ساعات شهريًا — الأكثر اختيارًا للأسر.",
      descriptionEn: "8 hours per month — the most popular for families.",
      hours: 8,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      titleAr: "الباقة المميّزة",
      titleEn: "Premium",
      descriptionAr: "١٢ ساعة شهريًا — تقدّم أسرع ومتابعة أقرب.",
      descriptionEn: "12 hours per month — faster progress, closer follow-up.",
      hours: 12,
      isFeatured: false,
      sortOrder: 3,
    },
  ];

  const plans = {};
  for (const def of planDefs) {
    let plan = await prisma.plan.findFirst({ where: { titleEn: def.titleEn } });
    if (!plan) {
      plan = await prisma.plan.create({
        data: { ...def, isActive: true },
      });
    }
    plans[def.titleEn] = plan;
  }

  // Example plan discount, now modelled as a plan-linked coupon (15% off the
  // monthly price of the featured plan) — idempotent-ish.
  const featured = plans.Standard;
  if (featured) {
    const code = "AYA-WELCOME15";
    const hasCoupon = await prisma.coupon.findUnique({ where: { code } });
    if (!hasCoupon) {
      await prisma.coupon.create({
        data: {
          code,
          type: "PERCENT",
          value: 15,
          source: "MANUAL",
          billingPeriod: "MONTHLY",
          isActive: true,
          plans: { create: [{ planId: featured.id }] },
        },
      });
    }
  }

  console.log(`[seed] plans — ${planDefs.length} upserted (hours only)`);
  return plans;
}

