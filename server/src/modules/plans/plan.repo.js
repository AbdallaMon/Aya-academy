import { prisma } from "@aya/db/prisma.client.js";

// Admin list/detail carries a count of the plan's ACTIVE discounts only
// (disabled coupons live on the Coupons page, not under the plan).
const listInclude = {
  _count: { select: { coupons: { where: { coupon: { isActive: true } } } } },
};

class PlanRepo {
  async listPlans(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        skip,
        take,
        orderBy: { sortOrder: "asc" },
        include: listInclude,
      }),
      prisma.plan.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.plan.findUnique({
      where: { id },
      include: listInclude,
    });
  }

  // Plan with its linked coupons (the plan's discounts) — for pricing at
  // subscription time.
  getByIdWithCoupons(id) {
    return prisma.plan.findUnique({
      where: { id },
      include: { coupons: { include: { coupon: true } } },
    });
  }

  // Public pricing: active plans with their linked coupons (the plan discounts).
  listActiveWithCoupons() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { coupons: { include: { coupon: true } } },
    });
  }

  createPlan(data) {
    return prisma.plan.create({ data, include: listInclude });
  }

  updatePlan(id, data) {
    return prisma.plan.update({
      where: { id },
      data,
      include: listInclude,
    });
  }

  deactivatePlan(id) {
    return prisma.plan.update({
      where: { id },
      data: { isActive: false },
      include: listInclude,
    });
  }
}

export const planRepo = new PlanRepo();
