// Shared pricing helpers for plans, coupons and subscriptions.
//
// A Plan now stores ONLY its number of hours. The price is always derived from
// the single global hourly rate (AppSetting.hourlyRate): monthly = hours × rate,
// yearly = monthly × 12. The chosen cycle lives on the Subscription. Discounts
// are Coupons; a plan-scoped coupon may target a specific cycle (or both, when
// `billingPeriod` is null).

import { BILLING_PERIODS, DISCOUNT_TYPES } from "@ayah/shared";
import { MINUTES_PER_HOUR } from "./duration.js";

/** Effective monthly price: hours × global hourly rate. */
export function effectiveMonthlyPrice(plan, hourlyRate) {
  return Number(plan.hours) * Number(hourlyRate);
}

/** Effective yearly price: monthly × 12. */
export function effectiveYearlyPrice(plan, hourlyRate) {
  return effectiveMonthlyPrice(plan, hourlyRate) * 12;
}

/** Base price for the chosen billing cycle (before any discount). */
export function priceForPeriod(plan, billingPeriod, hourlyRate) {
  return billingPeriod === BILLING_PERIODS.YEARLY
    ? effectiveYearlyPrice(plan, hourlyRate)
    : effectiveMonthlyPrice(plan, hourlyRate);
}

/** Exact minute-based subscription price, rounded only after the full duration. */
export function priceFromMinutes(minutes, hourlyRate) {
  return roundMoney(
    (Number(minutes) * Number(hourlyRate)) / MINUTES_PER_HOUR,
  );
}

/** Apply a PERCENT/FIXED discount to a price, floored at 0. */
export function applyDiscount(price, { type, value }) {
  const v = Number(value);
  if (type === DISCOUNT_TYPES.PERCENT) {
    return Math.max(0, price * (1 - v / 100));
  }
  return Math.max(0, price - v);
}

/** Is a coupon currently redeemable (active, in-window, under cap)? */
export function isCouponActive(coupon, now = new Date()) {
  if (!coupon || !coupon.isActive) return false;
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return false;
  if (coupon.endsAt && now > new Date(coupon.endsAt)) return false;
  if (
    coupon.maxRedemptions !== null &&
    coupon.maxRedemptions !== undefined &&
    coupon.redemptionsCount >= coupon.maxRedemptions
  ) {
    return false;
  }
  return true;
}

/** Does a coupon apply to the given cycle? (null scope = both cycles.) */
export function couponAppliesToPeriod(coupon, billingPeriod) {
  return !coupon.billingPeriod || coupon.billingPeriod === billingPeriod;
}

/** Round money to 2 decimals. */
export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
