export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{3,30}$/u;

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function buildIdentityPayload({ email, username } = {}) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  return {
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
    ...(normalizedUsername ? { username: normalizedUsername } : {}),
  };
}

export function buildEditableIdentityPayload({ email, username } = {}) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  return {
    email: normalizedEmail || null,
    username: normalizedUsername || null,
  };
}

export function validateOptionalIdentity(
  { email, username } = {},
  { requiredMessage, invalidEmailMessage, invalidUsernameMessage } = {},
) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  const errors = {};

  if (!normalizedEmail && !normalizedUsername) {
    errors.email = requiredMessage;
    errors.username = requiredMessage;
    return errors;
  }
  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    errors.email = invalidEmailMessage;
  }
  if (normalizedUsername && !USERNAME_PATTERN.test(normalizedUsername)) {
    errors.username = invalidUsernameMessage;
  }
  return errors;
}
