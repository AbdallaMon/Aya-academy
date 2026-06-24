import { prisma } from "@aya/db/prisma.client.js";

const planInclude = {
  plans: { include: { plan: { select: { id: true, titleAr: true, titleEn: true } } } },
};

class CouponRepo {
  async listCoupons(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: planInclude,
      }),
      prisma.coupon.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.coupon.findUnique({
      where: { id },
      include: planInclude,
    });
  }

  getByCode(code) {
    return prisma.coupon.findUnique({
      where: { code },
      include: planInclude,
    });
  }

  async createCoupon(data, planIds) {
    return prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.create({ data });
      if (planIds && planIds.length) {
        await tx.couponPlan.createMany({
          data: planIds.map((planId) => ({ couponId: coupon.id, planId })),
        });
      }
      return tx.coupon.findUnique({
        where: { id: coupon.id },
        include: planInclude,
      });
    });
  }

  async updateCoupon(id, data, planIds) {
    return prisma.$transaction(async (tx) => {
      await tx.coupon.update({ where: { id }, data });
      if (planIds !== undefined) {
        await tx.couponPlan.deleteMany({ where: { couponId: id } });
        if (planIds.length) {
          await tx.couponPlan.createMany({
            data: planIds.map((planId) => ({ couponId: id, planId })),
          });
        }
      }
      return tx.coupon.findUnique({
        where: { id },
        include: planInclude,
      });
    });
  }

  deactivateCoupon(id) {
    return prisma.coupon.update({
      where: { id },
      data: { isActive: false },
      include: planInclude,
    });
  }

  /** Atomically bump a coupon's redemption counter (race-safe). */
  incrementCouponRedemption(id, client) {
    return (client ?? prisma).coupon.update({
      where: { id },
      data: { redemptionsCount: { increment: 1 } },
    });
  }
}

export const couponRepo = new CouponRepo();
