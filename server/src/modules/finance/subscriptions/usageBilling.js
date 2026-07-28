// Pure billing-minutes resolver (same v3 fallback rules, canonical minute unit).

/**
 * Resolve the minutes to freeze for a USAGE subscription's bill.
 * Actual usage bills as-is (even below plan); zero sessions fall back to the
 * subscription's OWN inherited plan minutes. Null only when the sub has no linked
 * plan and no usage (caller skips).
 *
 * @param {{ usageMinutes:number, planMinutes:number|null }} args
 * @returns {number|null}
 */
export function resolveUsageMinutes({ usageMinutes, planMinutes }) {
  if (usageMinutes > 0) return usageMinutes; // actual bills as-is, even below plan
  return planMinutes ?? null; // zero sessions → the sub's own inherited plan minutes
}
