export const SESSION_LOGS_URL = "session-logs";
export const USERS_URL = "users";
export const MY_STUDENTS_URL = "users/my-students";

/** YYYY-MM-DD for an <input type="date"> from an ISO string / Date. */
export function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Current month as "YYYY-MM" (for the default month filter + <input type="month">). */
export function currentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Localized long date for a session's sessionDate (falls back to "—"). */
export function formatSessionDate(value, lng) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lng === "en" ? "en-GB" : "ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Display name for a student (name + nickname fallback). */
export function studentLabel(student) {
  if (!student) return "";
  if (student.nickname && student.nickname !== student.name) {
    return `${student.name} (${student.nickname})`;
  }
  return student.name;
}
