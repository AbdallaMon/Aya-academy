export const REWARDS_URL = "rewards";

// Mirrors server REWARD_TYPES.
export const REWARD_TYPES = ["COUPON", "FREE_LECTURES", "BADGE"];
// Mirrors server REWARD_STATUSES.
export const REWARD_STATUSES = ["PENDING", "CLAIMED", "EXPIRED"];

// Visual identity per reward type (emoji + MUI palette color).
export const REWARD_TYPE_META = {
  BADGE: { emoji: "🏅", color: "warning" },
  COUPON: { emoji: "🎟️", color: "secondary" },
  FREE_LECTURES: { emoji: "📚", color: "info" },
};

export const REWARD_STATUS_COLOR = {
  PENDING: "warning",
  CLAIMED: "success",
  EXPIRED: "default",
};

/** Render a date for display. */
export function formatDate(value, lng) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(lng === "en" ? "en-GB" : "ar-EG", {
    dateStyle: "medium",
  }).format(d);
}
