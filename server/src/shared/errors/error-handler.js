import { generalMessagesCodes, messagesNames } from "@aya/shared";
import { AppError } from "./AppError.js";

export function notFoundHandler(_req, res) {
  return res.status(404).json({
    success: false,
    message: generalMessagesCodes.NOT_FOUND,
    code: generalMessagesCodes.NOT_FOUND,
    translationKey: messagesNames.generalMessages,
  });
}

function isPrismaKnownError(err) {
  return (
    Boolean(err) &&
    err.name === "PrismaClientKnownRequestError" &&
    typeof err.code === "string"
  );
}

// Express identifies error middleware by its 4-arg signature.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: generalMessagesCodes.CONFLICT,
        code: generalMessagesCodes.CONFLICT,
        translationKey: messagesNames.generalMessages,
        details: err.meta ?? null,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: generalMessagesCodes.NOT_FOUND,
        code: generalMessagesCodes.NOT_FOUND,
        translationKey: messagesNames.generalMessages,
      });
    }
    return res.status(400).json({
      success: false,
      message: generalMessagesCodes.BAD_REQUEST,
      code: generalMessagesCodes.BAD_REQUEST,
      translationKey: messagesNames.generalMessages,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      // `message` must be the language-neutral CODE (the client localises it via
      // translationKey). AppError.message defaults to INTERNAL_SERVER_ERROR when
      // a throw passes only `code`, so always surface `code` here, not `message`.
      success: false,
      message: err.code,
      code: err.code,
      translationKey: err.translationKey,
      details: err.details,
      dontRedirect: err.dontRedirect,
      redirectTo: err.redirectTo,
      redirectText: err.redirectText,
    });
  }

  console.error(
    `[error-handler] ${req.method} ${req.originalUrl}:`,
    err instanceof Error ? err.stack : err,
  );
  return res.status(500).json({
    success: false,
    message: generalMessagesCodes.UNEXPECTED_ERROR,
    code: generalMessagesCodes.INTERNAL_SERVER_ERROR,
    translationKey: messagesNames.generalMessages,
  });
}
