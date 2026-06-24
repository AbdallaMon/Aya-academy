import { prisma } from "@aya/db/prisma.client.js";

class PlanRepo {
  async listPlans(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        skip,
        take,
        orderBy: { sortOrder: "asc" },
        include: { discounts: true },
      }),
      prisma.plan.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.plan.findUnique({
      where: { id },
      include: { discounts: true },
    });
  }

  listActiveWithDiscounts() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { discounts: true },
    });
  }

  createPlan(data) {
    return prisma.plan.create({ data, include: { discounts: true } });
  }

  updatePlan(id, data) {
    return prisma.plan.update({
      where: { id },
      data,
      include: { discounts: true },
    });
  }

  deactivatePlan(id) {
    return prisma.plan.update({
      where: { id },
      data: { isActive: false },
      include: { discounts: true },
    });
  }

  // ── discounts ───────────────────────────────────────────
  getDiscount(id, planId) {
    return prisma.planDiscount.findFirst({ where: { id, planId } });
  }

  createDiscount(data) {
    return prisma.planDiscount.create({ data });
  }

  updateDiscount(id, data) {
    return prisma.planDiscount.update({ where: { id }, data });
  }

  deleteDiscount(id) {
    return prisma.planDiscount.delete({ where: { id } });
  }

  /** Atomically bump a discount's redemption counter (race-safe). */
  incrementDiscountRedemption(id, client) {
    return (client ?? prisma).planDiscount.update({
      where: { id },
      data: { redemptionsCount: { increment: 1 } },
    });
  }
}

export const planRepo = new PlanRepo();
