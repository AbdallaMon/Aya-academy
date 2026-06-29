// Language-neutral message codes for the coupons module.
// Surfaced to the frontend via translationKey `messagesNames.couponMessages`.
export const couponMessagesCodes = {
  COUPON_NOT_FOUND: "COUPON_NOT_FOUND",
  COUPON_CODE_REQUIRED: "COUPON_CODE_REQUIRED",
  COUPON_INVALID: "COUPON_INVALID",
  COUPON_EXPIRED: "COUPON_EXPIRED",
  COUPON_NOT_APPLICABLE: "COUPON_NOT_APPLICABLE",
  COUPON_CODE_TAKEN: "COUPON_CODE_TAKEN",
  // maxRedemptions can't be lowered below the times it was already redeemed.
  COUPON_MAX_BELOW_USAGE: "COUPON_MAX_BELOW_USAGE",
};
