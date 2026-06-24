export const REPORTS_URL = "reports";
export const USERS_URL = "users";

/** YYYY-MM-DD for an <input type="date"> from an ISO string / Date. */
export function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Display name for a student row (name + nickname fallback). */
export function studentLabel(student) {
  if (!student) return "";
  if (student.nickname && student.nickname !== student.name) {
    return `${student.name} (${student.nickname})`;
  }
  return student.name;
}
