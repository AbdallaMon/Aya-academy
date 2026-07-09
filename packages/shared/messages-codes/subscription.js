// Language-neutral message codes for the subscriptions module.
// Surfaced to the frontend via translationKey `messagesNames.subscriptionMessages`.
export const subscriptionMessagesCodes = {
  SUBSCRIPTION_NOT_FOUND: "SUBSCRIPTION_NOT_FOUND",
  STUDENT_REQUIRED: "SUBSCRIPTION_STUDENT_REQUIRED",
  INVALID_DATE_RANGE: "INVALID_DATE_RANGE",
  CANNOT_ACCESS_SUBSCRIPTION: "CANNOT_ACCESS_SUBSCRIPTION",
  // Feature blocked because the student has no ACTIVE subscription.
  SUBSCRIPTION_INACTIVE: "SUBSCRIPTION_INACTIVE",
  PLAN_REQUIRED: "PLAN_REQUIRED",
  PLAN_NOT_FOUND: "SUBSCRIPTION_PLAN_NOT_FOUND",
  STUDENT_NOT_LINKED: "STUDENT_NOT_LINKED",
  NOT_PENDING: "NOT_PENDING",
  COUPON_INVALID: "SUBSCRIPTION_COUPON_INVALID",
  // Cancel action
  CANNOT_CANCEL: "CANNOT_CANCEL",
  SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
  // Renewal + activation actions
  SUBSCRIPTION_STILL_ACTIVE: "SUBSCRIPTION_STILL_ACTIVE",
  SUBSCRIPTION_RENEWED: "SUBSCRIPTION_RENEWED",
  PLAN_CHANGED: "PLAN_CHANGED",
  SUBSCRIPTION_ACTIVATED: "SUBSCRIPTION_ACTIVATED",
  CANNOT_CHANGE_PLAN_PAID: "CANNOT_CHANGE_PLAN_PAID",
  // Activation blocked because the subscription's month has not arrived yet
  // (only allowed from the last day of the preceding month onwards).
  ACTIVATION_TOO_EARLY: "SUBSCRIPTION_ACTIVATION_TOO_EARLY",
  // Create-by-month: a USAGE subscription already exists for this (student, month).
  USAGE_SUBSCRIPTION_EXISTS: "USAGE_SUBSCRIPTION_EXISTS",
};
