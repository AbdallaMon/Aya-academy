export const PLANS_URL = "plans";
export const COUPONS_URL = "coupons";

export const DISCOUNT_TYPES = ["PERCENT", "FIXED"];

/**
 * Billing-period scope for a coupon/discount.
 * "ALL" is a UI-only sentinel mapping to null (applies to BOTH cycles) — null
 * can't be an object key in a value→label select map.
 */
export const BILLING_SCOPES = ["MONTHLY", "YEARLY", "ALL"];

/** Format a number as GBP (the academy currency). */
export function formatGBP(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(n);
}
