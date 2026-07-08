// Pure billing-hours resolver (spec §4). No student is skipped unless the
// system has no plans at all. Kept side-effect-free so it is unit-testable.

/**
 * Resolve the hours to freeze for a USAGE subscription's bill.
 * Actual usage bills as-is (even below plan); zero sessions fall back to the
 * student's plan hours, then the lowest active plan; null only when the system
 * has no plans at all (caller skips).
 */
export function resolveUsageHours({ usageHours, planHours, lowestPlanHours }) {
  if (usageHours > 0) return usageHours; // actual bills as-is, even below plan
  if (planHours != null) return planHours; // zero sessions → student's plan
  if (lowestPlanHours != null) return lowestPlanHours; // → lowest active plan
  return null; // no plans exist → caller skips
}
