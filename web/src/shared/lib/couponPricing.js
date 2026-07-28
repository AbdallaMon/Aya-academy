// Coupon/discount resolution shared by every "add subscription" surface
// (register wizard, parent plan picker, admin dialogs). One rule everywhere:
//   price = base, UNLESS a coupon code is attached.
// The plan's own coupon is offered as a REMOVABLE DEFAULT — never forced. All
// inputs use the `/plans/public` plan shape: { monthly|yearly: { base, effective,
// discount: { type, value, code } | null }, currency, hours }.

/** The pricing block for the chosen billing cycle. */
export function cycleOf(plan, billingPeriod) {
  if (!plan) return null;
  return billingPeriod === "YEARLY" ? plan.yearly : plan.monthly;
}

/** The plan's own coupon for this cycle (with a code), or null. */
export function planCouponOf(plan, billingPeriod) {
  const cycle = cycleOf(plan, billingPeriod);
  return cycle?.discount?.code ? cycle.discount : null;
}

/**
 * Coupon state shape used across the surfaces:
 *   { status: 'idle'|'plan'|'custom'|'none'|'invalid', code, quote, reason }
 * - idle    : no plan coupon, none typed yet (show input)
 * - plan    : the plan's default coupon is applied (removable)
 * - custom  : a verified custom code is applied (removable)
 * - none    : user removed the discount → base price
 * - invalid : a typed custom code failed validation
 */
export function initialCoupon(plan, billingPeriod) {
  return {
    status: planCouponOf(plan, billingPeriod) ? "plan" : "idle",
    code: "",
    quote: null,
    reason: null,
  };
}

/**
 * Resolve what to charge and which code to send for the current coupon state.
 * @returns {{ base:number, net:number, currency:string, codeToSend:string|undefined,
 *             applyPlanCoupon:boolean, discountAmount:number,
 *             applied:'plan'|'custom'|null }}
 */
export function resolveCoupon(plan, billingPeriod, coupon) {
  const cycle = cycleOf(plan, billingPeriod);
  const base = cycle?.base ?? 0;
  const currency = plan?.currency;
  const planCoupon = planCouponOf(plan, billingPeriod);
  const status = coupon?.status;

  if (status === "custom" && coupon.quote?.net != null) {
    const net = coupon.quote.net;
    return {
      base,
      net,
      currency,
      codeToSend: coupon.code?.trim() || undefined,
      applyPlanCoupon: false,
      discountAmount: Math.max(0, base - net),
      applied: "custom",
    };
  }

  if (status === "plan" && planCoupon) {
    const net = cycle?.effective ?? base;
    return {
      base,
      net,
      currency,
      codeToSend: planCoupon.code,
      applyPlanCoupon: true,
      discountAmount: Math.max(0, base - net),
      applied: "plan",
    };
  }

  // idle / none / invalid → base price, no discount
  return {
    base,
    net: base,
    currency,
    codeToSend: undefined,
    applyPlanCoupon: false,
    discountAmount: 0,
    applied: null,
  };
}
