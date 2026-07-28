export const MINUTES_PER_HOUR = 60;
export const LEGACY_MINUTES_THRESHOLD = 30;

export function minutesFromHours(hours) {
  if (hours === null || hours === undefined || hours === "") return null;
  const value = Number(hours);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * MINUTES_PER_HOUR);
}

export function hoursFromMinutes(minutes) {
  if (minutes === null || minutes === undefined || minutes === "") return null;
  const value = Number(minutes);
  if (!Number.isFinite(value)) return null;
  return value / MINUTES_PER_HOUR;
}

/**
 * Interpret an unmigrated legacy duration. Values of 30 or more are treated as
 * already-minute values, per the production-data migration rule.
 */
export function legacyValueToMinutes(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric >= LEGACY_MINUTES_THRESHOLD
    ? Math.round(numeric)
    : minutesFromHours(numeric);
}

/** Prefer the canonical minute field, falling back to a legacy stored value. */
export function resolveStoredMinutes(minutes, legacyValue) {
  if (minutes !== null && minutes !== undefined) {
    const numeric = Number(minutes);
    return Number.isFinite(numeric) ? Math.round(numeric) : null;
  }
  return legacyValueToMinutes(legacyValue);
}
