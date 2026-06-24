export const QUIZZES_URL = "quizzes";

/** Render a date for display. */
export function formatDate(value, lng) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(lng === "en" ? "en-GB" : "ar-EG", {
    dateStyle: "medium",
  }).format(d);
}
