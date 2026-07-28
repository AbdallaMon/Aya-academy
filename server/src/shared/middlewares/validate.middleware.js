import { generalMessagesCodes } from "@ayah/shared";
import { AppError } from "../errors/AppError.js";

// Our message codes are SCREAMING_SNAKE_CASE (e.g. USER_NAME_REQUIRED). A Zod
// default message is a human sentence ("Invalid input", "Required") that has no
// ar/en localization and would leak raw to the user. Coerce anything that isn't
// one of our codes into the localized generic VALIDATION_ERROR code.
const CODE_RE = /^[A-Z][A-Z0-9_]*$/;
const asCode = (msg) =>
  typeof msg === "string" && CODE_RE.test(msg) ? msg : generalMessagesCodes.VALIDATION_ERROR;

/** Validate req[source] against a Zod schema; replaces it with the parsed data. */
export function validate(schema, source = "body", translationKey = null) {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: asCode(issue.message),
      }));
      const message = details[0]?.message ?? generalMessagesCodes.VALIDATION_ERROR;
      next(
        new AppError({
          statusCode: 422,
          code: message,
          message,
          translationKey,
          details,
        }),
      );
      return;
    }
    if (source === "body") req.body = result.data;
    else Object.assign(req[source], result.data);
    next();
  };
}
