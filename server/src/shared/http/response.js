// ===========================================================================
// Response helpers — seal the uniform envelope consistently.
//
// Shape: { success, message, data, translationKey }
//  - message        : a language-neutral CODE (SCREAMING_SNAKE) — never human text.
//  - translationKey : (optional) namespace pointing the frontend at its strings.
//
// Do NOT call res.json directly in controllers — use these helpers.
// The failure path goes through AppError + errorHandler.
// ===========================================================================

import { generalMessagesCodes } from "@ayah/shared";

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

export function updated(
  res,
  data,
  message = generalMessagesCodes.UPDATED,
  translationKey = null,
) {
  return res.status(200).json({ success: true, message, data, translationKey });
}

export function deleted(
  res,
  message = generalMessagesCodes.DELETED,
  translationKey = null,
) {
  return res.status(200).json({ success: true, message, data: null, translationKey });
}

export function noContent(res) {
  return res.status(204).send();
}
