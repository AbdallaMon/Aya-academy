import { generalMessagesCodes } from "@aya/shared";
import { AppError } from "../errors/AppError.js";

/** Validate req[source] against a Zod schema; replaces it with the parsed data. */
export function validate(schema, source = "body", translationKey = null) {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
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
