// Question bank + categories endpoints (relative to the API base used by useRequest).
export const BANK_URL = "quizzes/bank";
export const CATEGORIES_URL = "quizzes/categories";

/** Render a date for display. */
export function formatDate(value, lng) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(lng === "en" ? "en-GB" : "ar-EG", {
    dateStyle: "medium",
  }).format(d);
}
