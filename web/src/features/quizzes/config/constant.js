export const QUIZZES_URL = "quizzes";

// Parent's own children — used for the "أطفالي" per-child list filter (same
// endpoint QuizBuildPage uses). Returns [{ id, name, nickname }].
export const MY_STUDENTS_URL = "users/my-students";

/** Render a date for display. */
export function formatDate(value, lng) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(lng === "en" ? "en-GB" : "ar-EG", {
    dateStyle: "medium",
  }).format(d);
}
