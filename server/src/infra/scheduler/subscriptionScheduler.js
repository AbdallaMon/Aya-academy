// ===========================================================================
// subscriptionScheduler — end-of-month cron for automatic subscription renewal.
//
// node-cron has no "last day of month" token, so we schedule on the candidate
// late days (28-31) at 23:00 and fire the renewal ONLY on the actual last day
// of that month (detected via "tomorrow is the 1st"). This is correct for every
// month length — 28 (Feb), 29 (Feb leap), 30, and 31 — without special-casing.
//
// startSubscriptionScheduler(): called on server boot (guarded — never breaks
// boot). It invokes subscriptionUsecase.autoRenewSubscriptions(), which is a
// stub for now; the cron wiring is complete so filling that method in is enough
// to go live. The handler swallows errors so a failed run never crashes the cron.
// ===========================================================================

import cron from "node-cron";
import { subscriptionUsecase } from "../../modules/subscriptions/subscription.usecase.js";

// 23:00 on days 28-31 of every month. The last-day guard below narrows this to
// exactly the final day of the current month.
const CRON_EXPR = "0 23 28-31 * *";

let task = null;

/** True when `date` is the last day of its month (i.e. tomorrow is the 1st). */
function isLastDayOfMonth(date = new Date()) {
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  return tomorrow.getDate() === 1;
}

/** Starts the end-of-month auto-renew cron. Idempotent + guarded (never throws). */
export function startSubscriptionScheduler() {
  if (task) return;
  task = cron.schedule(CRON_EXPR, () => {
    const now = new Date();
    if (!isLastDayOfMonth(now)) return; // not the last day yet — skip 28/29/30
    subscriptionUsecase.autoRenewSubscriptions(now).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(
        "[subscription-cron] auto-renew error:",
        err?.code || err?.message || err,
      );
    });
  });
  // eslint-disable-next-line no-console
  console.log(
    "[subscription-cron] end-of-month auto-renew scheduled (23:00 on the last day of each month)",
  );
}

/** Stops the cron (used on shutdown / in tests). */
export function stopSubscriptionScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}

export { isLastDayOfMonth };
