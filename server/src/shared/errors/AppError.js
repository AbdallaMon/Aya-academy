import {
  authMessagesCodes,
  generalMessagesCodes,
  messagesNames,
} from "@ayah/shared";

/**
 * Operational error carrying a language-neutral code + translationKey so the
 * frontend can localise it. Throw from usecases/repos; caught by errorHandler.
 */
export class AppError extends Error {
  constructor({
    message = generalMessagesCodes.INTERNAL_SERVER_ERROR,
    statusCode = 500,
    code = generalMessagesCodes.INTERNAL_SERVER_ERROR,
    translationKey = null,
    details = null,
    dontRedirect = true,
    redirectTo = null,
    redirectText = null,
  } = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.translationKey = translationKey;
    this.details = details;
    this.isOperational = true;
    this.dontRedirect = dontRedirect;
    this.redirectTo = redirectTo;
    this.redirectText = redirectText;
  }
}

// ── factory helpers ─────────────────────────────────────────
export const unauthorized = (message = authMessagesCodes.UNAUTHORIZED) =>
  new AppError({
    statusCode: 401,
    code: message,
    message,
    translationKey: messagesNames.authMessages,
    redirectTo: "/login",
    redirectText: authMessagesCodes.BACK_TO_LOGIN,
  });

export const forbidden = (message = authMessagesCodes.FORBIDDEN) =>
  new AppError({
    statusCode: 403,
    code: message,
    message,
    translationKey: messagesNames.authMessages,
  });

export const notFound = (message = generalMessagesCodes.NOT_FOUND) =>
  new AppError({
    statusCode: 404,
    code: message,
    message,
    translationKey: messagesNames.generalMessages,
  });

export const badRequest = (
  message = generalMessagesCodes.BAD_REQUEST,
  translationKey = messagesNames.generalMessages,
  details = null,
) =>
  new AppError({
    statusCode: 400,
    code: message,
    message,
    translationKey,
    details,
  });

export const conflict = (
  message = generalMessagesCodes.CONFLICT,
  translationKey = messagesNames.generalMessages,
) =>
  new AppError({
    statusCode: 409,
    code: message,
    message,
    translationKey,
  });

export const tooManyRequests = (
  message = generalMessagesCodes.TOO_MANY_REQUESTS,
  translationKey = messagesNames.generalMessages,
  details = null,
) =>
  new AppError({
    statusCode: 429,
    code: message,
    message,
    translationKey,
    details,
  });
