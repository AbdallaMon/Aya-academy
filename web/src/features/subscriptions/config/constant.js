export const SUBSCRIPTIONS_URL = "subscriptions";
export const USERS_URL = "users";
export const PLANS_URL = "plans";
// Public active plans (with pricing + the plan's own removable coupon) for the
// create-subscription plan picker. Same endpoint the renew/change-plan pickers use.
export const PLANS_PUBLIC_URL = "plans/public";
export const subscriptionPlanOptionsPath = (studentId) =>
  `subscriptions/plan-options/${studentId}`;
export const SUBSCRIPTION_PLAN_QUOTE_URL = "subscriptions/plan-quote";

export const SUBSCRIPTION_STATUSES = [
  "PENDING",
  "UPCOMING",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
];

/** MUI Chip color per status. */
export const STATUS_COLOR = {
  PENDING: "warning",
  UPCOMING: "info",
  ACTIVE: "success",
  EXPIRED: "default",
  CANCELLED: "error",
};

export function formatGBP(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(Number(value));
}
