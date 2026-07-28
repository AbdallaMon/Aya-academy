// UTC-safe month-boundary helpers. Mirrors parseMonthRange in sessionLog.repo,
// keeping every window derived from UTC so billing buckets are timezone-stable.

/** Half-open [1st of month, 1st of next month) range covering `date`'s UTC month. */
export function monthRange(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return { gte: new Date(Date.UTC(y, m, 1)), lt: new Date(Date.UTC(y, m + 1, 1)) };
}

/** Midnight UTC on the 1st of the month after `date`. */
export function firstOfNextMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

/** Last inclusive instant (23:59:59) of the month `firstOfMonth` begins. */
export function endOfMonth(firstOfMonth) {
  // Day 0 of the next month is the last day of this month.
  return new Date(
    Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0, 23, 59, 59),
  );
}

/** Midnight UTC on the 1st of the month before `date`. */
export function previousMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
}

/** Inclusive calendar-month window: first day through the final second. */
export function calendarMonthWindow(date) {
  const { gte } = monthRange(new Date(date));
  return { startDate: gte, endDate: endOfMonth(gte) };
}

/** Stable application key used by the nullable unique USAGE-month slot. */
export function usageMonthKey(studentId, date) {
  const start = monthRange(new Date(date)).gte;
  return `${Number(studentId)}:${start.getUTCFullYear()}-${String(
    start.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}
