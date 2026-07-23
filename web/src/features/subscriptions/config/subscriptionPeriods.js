const CURRENT_STATUS_RANK = {
  ACTIVE: 4,
  PENDING: 3,
  UPCOMING: 2,
  CANCELLED: 1,
  EXPIRED: 0,
};

function isInside(value, startDate, endDate) {
  const at = new Date(value).getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return (
    Number.isFinite(at) &&
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start <= at &&
    at <= end
  );
}

function isSameUtcMonth(value, target) {
  const date = new Date(value);
  return (
    Number.isFinite(date.getTime()) &&
    date.getUTCFullYear() === target.getUTCFullYear() &&
    date.getUTCMonth() === target.getUTCMonth()
  );
}

/**
 * Select the calendar buckets shown throughout the UI. Current is independent
 * of payment status; next accepts both accumulating and awaiting-payment usage
 * subscriptions, but only for the actual next calendar month.
 */
export function selectSubscriptionPeriods(rows, now = new Date()) {
  const subscriptions = Array.isArray(rows) ? rows.filter(Boolean) : [];
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const current =
    subscriptions
      .filter(
        (sub) =>
          sub.status !== "EXPIRED" &&
          isInside(now, sub.startDate, sub.endDate),
      )
      .sort(
        (a, b) =>
          (CURRENT_STATUS_RANK[b.status] ?? -1) -
            (CURRENT_STATUS_RANK[a.status] ?? -1) ||
          new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
      )[0] ?? null;

  const next =
    subscriptions
      .filter(
        (sub) =>
          sub.origin === "USAGE" &&
          ["PENDING", "UPCOMING"].includes(sub.status) &&
          isSameUtcMonth(sub.startDate, nextMonth),
      )
      .sort(
        (a, b) =>
          (a.status === "PENDING" ? -1 : 1) -
            (b.status === "PENDING" ? -1 : 1) ||
          Number(b.id ?? 0) - Number(a.id ?? 0),
      )[0] ?? null;

  return { current, next };
}
