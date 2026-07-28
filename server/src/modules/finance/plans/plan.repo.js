// ===========================================================================
// plan.repo — Prisma I/O only on Plan. (Reference idiom: single object args with
// optional `client`, list owns filtering + pagination and returns
// { items, total, page, pageSize }.)
//
// NOTE: `getById` and `getByIdWithCoupons` keep a POSITIONAL `(id)` signature —
// they are called cross-module (auth / invoices / subscriptions) and their
// parameter shape is frozen.
// ===========================================================================

import { prisma } from "@ayah/db/prisma.client.js";
import { paginate } from "../../../shared/utility/pagination.js";
import {
  buildSearchQuery,
  buildIsActiveFilter,
} from "../../../shared/utility/queryBuilders.js";
import { planListInclude, planWithCouponsInclude } from "./plan.dto.js";

class PlanRepo {
  buildListWhere({ search, isActive } = {}) {
    const where = {};

    const searchWhere = buildSearchQuery({
      searchType: "multiKeySearch",
      keysValues: [
        { key: "titleAr", value: typeof search === "string" ? search : undefined },
        { key: "titleEn", value: typeof search === "string" ? search : undefined },
      ],
    });
    if (searchWhere.OR) where.OR = searchWhere.OR;

    const active = buildIsActiveFilter({ isActive });
    if (active !== undefined) where.isActive = active;

    return where;
  }

  async listPlans({ page, limit, search, isActive, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    const where = this.buildListWhere({ search, isActive });

    const [items, total] = await Promise.all([
      db.plan.findMany({
        where,
        skip,
        take,
        orderBy: { sortOrder: "asc" },
        include: planListInclude,
      }),
      db.plan.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  // Positional `(id)` — also called cross-module (invoices / subscriptions).
  getById(id) {
    return prisma.plan.findUnique({
      where: { id },
      include: planListInclude,
    });
  }

  // Plan with its linked coupons (the plan's discounts) — for pricing at
  // subscription time.
  // Positional `(id)` — also called cross-module (auth / subscriptions).
  getByIdWithCoupons(id) {
    return prisma.plan.findUnique({
      where: { id },
      include: planWithCouponsInclude,
    });
  }

  // Public pricing: active plans with their linked coupons (the plan discounts).
  listActiveWithCoupons({ client } = {}) {
    return (client ?? prisma).plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: planWithCouponsInclude,
    });
  }

  /**
   * Default fallback plan for usage billing: prefer the featured (middle)
   * active plan, then the normal display order when no plan is featured.
   */
  getDefaultActiveWithCoupons({ client } = {}) {
    return (client ?? prisma).plan.findFirst({
      where: { isActive: true },
      orderBy: [
        { isFeatured: "desc" },
        { sortOrder: "asc" },
        { id: "asc" },
      ],
      include: planWithCouponsInclude,
    });
  }

  createPlan({ data, client } = {}) {
    return (client ?? prisma).plan.create({ data, include: planListInclude });
  }

  updatePlan({ id, data, client } = {}) {
    return (client ?? prisma).plan.update({
      where: { id },
      data,
      include: planListInclude,
    });
  }

  deactivatePlan({ id, client } = {}) {
    return (client ?? prisma).plan.update({
      where: { id },
      data: { isActive: false },
      include: planListInclude,
    });
  }
}

export const planRepo = new PlanRepo();
export { PlanRepo };
