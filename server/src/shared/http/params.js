import { badRequest } from "../errors/AppError.js";

// Shared request-parsing helpers used by controllers.

/** Parse a required positive-integer route/query param; 400 on anything else. */
export function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

/** Parse an optional positive-integer query param; undefined when absent, 400 when present-but-invalid. */
export function optionalIntQuery(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

/** The authenticated user attached by the auth middleware. */
export function authUser(req) {
  return req.auth;
}
