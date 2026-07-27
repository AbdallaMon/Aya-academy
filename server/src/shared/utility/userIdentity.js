export const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{3,30}$/u;

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

export function normalizeLoginIdentifier(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
