export const COUPONS_URL = "coupons";

export const DISCOUNT_TYPES = ["PERCENT", "FIXED"];

/**
 * Billing-period scope for a coupon. "ALL" is a UI-only sentinel mapping to null
 * (applies to BOTH cycles) — null can't be a select-map object key.
 */
export const BILLING_SCOPES = ["ALL", "MONTHLY"];

export const COUPON_SOURCES = [
  "MANUAL",
  "GAME_REWARD",
  "QUIZ_REWARD",
  "ADMIN_GIFT",
];

/** Format a number as GBP (the academy currency). */
export function formatGBP(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(n);
}

/** YYYY-MM-DD for an <input type="date"> from an ISO string / Date. */
export function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
