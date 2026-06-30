export const REPORTS_URL = "reports";
export const USERS_URL = "users";

/** YYYY-MM-DD for an <input type="date"> from an ISO string / Date. */
export function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Localized long date for a report's reportDate (falls back to "—"). */
export function formatReportDate(value, lng) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lng === "en" ? "en-GB" : "ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Short single-line excerpt of a report body for card previews. */
export function bodyExcerpt(body, max = 160) {
  if (!body) return "";
  const flat = String(body).replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trim()}…` : flat;
}

/** Display name for a student row (name + nickname fallback). */
export function studentLabel(student) {
  if (!student) return "";
  if (student.nickname && student.nickname !== student.name) {
    return `${student.name} (${student.nickname})`;
  }
  return student.name;
}
