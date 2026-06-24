export const PLANS_URL = "plans";

export const BILLING_PERIODS = ["MONTHLY", "YEARLY"];
export const DISCOUNT_TYPES = ["PERCENT", "FIXED"];
export const DISCOUNT_CONSTRAINTS = ["COUNT", "DURATION"];

/** Format a number as GBP (the academy currency). */
export function formatGBP(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(n);
}
