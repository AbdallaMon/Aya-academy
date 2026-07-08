import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../../shared/utility/pagination.js";
import {
  buildSearchQuery,
  buildIsActiveFilter,
} from "../../../shared/utility/queryBuilders.js";

const planInclude = {
  plans: { include: { plan: { select: { id: true, titleAr: true, titleEn: true } } } },
};

const COUPON_STATUSES = ["active", "disabled", "consumed"];

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
  /**
   * Build the `where` for a coupon list from raw query filters. Lives in the repo
   * because the lifecycle filter reuses `couponStatusConditions`, whose
   * cross-column comparison touches the Prisma client.
   */
  buildListWhere({ search, isActive, status, source, planId } = {}) {
    const where = {};
    const and = [];

    const searchWhere = buildSearchQuery({
      searchType: "multiKeySearch",
      keysValues: [{ key: "code", value: typeof search === "string" ? search : undefined }],
    });
    if (searchWhere.OR) and.push({ OR: searchWhere.OR });

    if (source && source !== "ALL") where.source = source;

    // Scope to a single plan's discounts (the per-plan discounts dialog).
    if (planId) where.plans = { some: { planId: Number(planId) } };

    // Lifecycle filter (active | disabled | consumed). Takes precedence over the
    // legacy isActive boolean filter; falls back to it when no status is given.
    if (status && COUPON_STATUSES.includes(status)) {
      where.isActive = status !== "disabled";
      and.push(...couponStatusConditions(status));
    } else {
      const active = buildIsActiveFilter({ isActive });
      if (active !== undefined) where.isActive = active;
    }

    if (and.length) where.AND = and;

    return where;
  }

  async listCoupons({ page, limit, search, isActive, status, source, planId, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    const where = this.buildListWhere({ search, isActive, status, source, planId });

    const [items, total] = await Promise.all([
      db.coupon.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: planInclude,
      }),
      db.coupon.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).coupon.findUnique({
      where: { id },
      include: planInclude,
    });
  }

  // Positional `(code)` — also called cross-module (subscriptions / plans).
  getByCode(code) {
    return prisma.coupon.findUnique({
      where: { code },
      include: planInclude,
    });
  }

  async createCoupon({ data, planIds, client } = {}) {
    const run = async (tx) => {
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
    };
    return client ? run(client) : prisma.$transaction(run);
  }

  async updateCoupon({ id, data, planIds, client } = {}) {
    const run = async (tx) => {
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
    };
    return client ? run(client) : prisma.$transaction(run);
  }

  deactivateCoupon({ id, client } = {}) {
    return (client ?? prisma).coupon.update({
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
export { CouponRepo };
