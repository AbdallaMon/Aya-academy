export const MY_STUDENTS_URL = "users/my-students";
export const CREATE_STUDENT_URL = "users/students";
export const SUBSCRIPTIONS_URL = "subscriptions";
export const SUBSCRIPTION_REQUEST_URL = "subscriptions/request";
export const PLANS_PUBLIC_URL = "plans/public";
export const subscriptionPlanOptionsPath = (studentId) =>
  `subscriptions/plan-options/${studentId}`;
export const SUBSCRIPTION_PLAN_QUOTE_URL = "subscriptions/plan-quote";

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
