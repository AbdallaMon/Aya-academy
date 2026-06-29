import { prisma } from "@aya/db/prisma.client.js";

const planInclude = {
  plans: { include: { plan: { select: { id: true, titleAr: true, titleEn: true } } } },
};

/**
 * Prisma `where` fragments for a coupon's COMPUTED state. A coupon's lifecycle
 * state isn't a stored column — it's derived from `isActive`, the time window
 * (`startsAt`/`endsAt`) and the usage cap (`redemptionsCount` vs `maxRedemptions`).
 * The cross-column comparison uses Prisma field references, so this lives in the
 * repo (the only layer allowed to touch the Prisma client).
 *
 * Returns an array of AND-conditions to combine with the caller's `where`. The
 * `isActive` boolean itself is set by the caller (disabled = isActive:false).
 *   - "active"   → not expired by date AND under the usage cap
 *   - "consumed" → still enabled but expired by date OR usage cap reached
 */
export function couponStatusConditions(status, now = new Date()) {
  const maxRef = prisma.coupon.fields.maxRedemptions;
  if (status === "active") {
    return [
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      { OR: [{ maxRedemptions: null }, { redemptionsCount: { lt: maxRef } }] },
    ];
  }
  if (status === "consumed") {
    return [
      {
        OR: [
          { endsAt: { lt: now } },
          {
            AND: [
              { maxRedemptions: { not: null } },
              { redemptionsCount: { gte: maxRef } },
            ],
          },
        ],
      },
    ];
  }
  return [];
}

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

  /**
   * Atomically release one redemption of a coupon (when a subscription that
   * consumed it is rejected/cancelled or has its coupon replaced). Uses
   * `updateMany` guarded by `redemptionsCount > 0` so the counter is never
   * driven below zero — at 0 it is a safe no-op (returns { count: 0 }).
   */
  decrementCouponRedemption(id, client) {
    return (client ?? prisma).coupon.updateMany({
      where: { id, redemptionsCount: { gt: 0 } },
      data: { redemptionsCount: { decrement: 1 } },
    });
  }
}

export const couponRepo = new CouponRepo();
