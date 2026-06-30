// ===========================================================================
// plan.dto — Prisma projections for the Plan module.
//
// Admin list/detail rows are returned to the client as-fetched (the include
// below carries an active-discount count), so there is no JS row reshaping and
// thus no output transformer here — only the shared projection the repo uses.
// ===========================================================================

// Admin list/detail carries a count of the plan's ACTIVE discounts only
// (disabled coupons live on the Coupons page, not under the plan).
export const planListInclude = {
  _count: { select: { coupons: { where: { coupon: { isActive: true } } } } },
};

// Plan with its linked coupons (the plan's discounts) — for pricing at
// subscription time and the public pricing endpoint.
export const planWithCouponsInclude = {
  coupons: { include: { coupon: true } },
};
