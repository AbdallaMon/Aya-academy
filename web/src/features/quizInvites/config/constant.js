// Invitations + supporting endpoints (relative to the API base used by useRequest).
export const INVITES_URL = "quizzes/invites";
export const BANK_URL = "quizzes/bank";
export const USERS_URL = "users";
export const BADGES_URL = "badges";

/** Invite status values surfaced by the backend. */
export const INVITE_STATUS = {
  PENDING: "PENDING",
  OPENED: "OPENED",
  BUILT: "BUILT",
  EXPIRED: "EXPIRED",
};

export const INVITE_STATUS_COLOR = {
  PENDING: "default",
  OPENED: "info",
  BUILT: "success",
  EXPIRED: "error",
};

/** Build the shareable parent-facing build link for an invite token. */
export function buildLinkForToken(lng, token, localePath) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${localePath(lng, `/dashboard/quiz-build/${token}`)}`;
}

export function formatDate(value, lng) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(lng === "en" ? "en-GB" : "ar-EG", {
    dateStyle: "medium",
  }).format(d);
}
