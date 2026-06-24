export const SESSIONS_URL = "sessions";
export const USERS_URL = "users";

// Mirrors server LESSON_STATUSES (sessions reuse the lesson status enum).
export const SESSION_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "MISSED"];

export const SESSION_STATUS_COLOR = {
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELLED: "default",
  MISSED: "error",
};

/** Convert an ISO/date string into a value an <input type="datetime-local"> accepts. */
export function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  // Strip seconds + timezone, keep local wall-clock time.
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Render a date/datetime for display. */
export function formatDateTime(value, lng) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(lng === "en" ? "en-GB" : "ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
