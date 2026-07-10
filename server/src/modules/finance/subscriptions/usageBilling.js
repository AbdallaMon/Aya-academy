// Pure billing-hours resolver (v3 §4). Kept side-effect-free so it is unit-testable.

/**
 * Resolve the hours to freeze for a USAGE subscription's bill.
 * Actual usage bills as-is (even below plan); zero sessions fall back to the
 * subscription's OWN inherited plan hours. Null only when the sub has no linked
 * plan and no usage (caller skips).
 *
 * @param {{ usageHours:number, planHours:number|null }} args
 * @returns {number|null}
 */
export function resolveUsageHours({ usageHours, planHours }) {
  if (usageHours > 0) return usageHours; // actual bills as-is, even below plan
  return planHours ?? null; // zero sessions → the sub's own inherited plan hours
}
