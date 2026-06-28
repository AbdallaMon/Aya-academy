import { generalMessagesCodes } from "@aya/shared";

export function ok(res, data, message = generalMessagesCodes.OK, translationKey = null) {
  return res.status(200).json({ success: true, message, data, translationKey });
}

export function created(
  res,
  data,
  message = generalMessagesCodes.CREATED,
  translationKey = null,
) {
  return res.status(201).json({ success: true, message, data, translationKey });
}
