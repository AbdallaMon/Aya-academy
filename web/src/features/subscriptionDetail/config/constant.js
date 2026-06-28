// Subscription-detail config. URLs + status colors are re-exported from the
// existing subscriptions/invoices configs so the maps live in ONE place.
export { SUBSCRIPTIONS_URL, STATUS_COLOR } from "../../subscriptions/config/constant.js";
export {
  INVOICES_URL,
  INVOICE_STATUS_COLOR,
  invoiceSubscriptionPath,
} from "../../invoices/config/constant.js";

/** Round a money value to 2 decimals (number, NaN-safe). */
export function round2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Resolve the price + discount breakdown for a subscription.
 * Prefers the invoice's frozen snapshot (invoice.configJson.discount), then
 * falls back to deriving from the subscription's coupon, else no discount.
 *
 * Returns { base, amount, code, hasDiscount } in the subscription currency.
 */
export function resolveDiscount({ subscription, invoice }) {
  const net = round2(subscription?.priceCharged);

  // 1) Invoice snapshot wins — it's the frozen source of truth.
  const snap = invoice?.configJson?.discount;
  if (snap && (Number(snap.amount) > 0 || Number(snap.base) > 0)) {
    return {
      base: round2(snap.base),
      amount: round2(snap.amount),
      code: snap.code || null,
      hasDiscount: Number(snap.amount) > 0,
    };
  }

  // 2) Derive from the subscription coupon.
  const coupon = subscription?.coupon;
  if (coupon) {
    const value = Number(coupon.value) || 0;
    if (coupon.type === "PERCENT" && value > 0 && value < 100) {
      const base = round2(net / (1 - value / 100));
      return { base, amount: round2(base - net), code: coupon.code || null, hasDiscount: true };
    }
    if (coupon.type === "FIXED" && value > 0) {
      const base = round2(net + value);
      return { base, amount: round2(value), code: coupon.code || null, hasDiscount: true };
    }
  }

  // 3) No discount — just the charged price.
  return { base: net, amount: 0, code: null, hasDiscount: false };
}
