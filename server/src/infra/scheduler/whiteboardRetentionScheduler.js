// ===========================================================================
// whiteboardRetentionScheduler — daily cleanup of expired whiteboard images.
//
// Board images are stored on disk and referenced by WhiteboardImage rows. Every
// day at 03:30 we read the admin-configured retention window (AppSetting
// .whiteboardRetentionDays, default 30, bounded 1..180) and delete every image
// older than that — file + row. Errors are swallowed so a failed run never
// crashes the cron. (Images are ALSO purged immediately when a session is
// deleted; this cron handles the age-based expiry.)
// ===========================================================================

import cron from "node-cron";
import { settingsUsecase } from "../../modules/settings/settings.usecase.js";
import { whiteboardSessionUsecase } from "../../modules/whiteboardSessions/whiteboardSession.usecase.js";

// 03:30 every day.
const CRON_EXPR = "30 3 * * *";

let task = null;

async function runRetentionSweep() {
  const settings = await settingsUsecase.getEffective();
  const retentionDays = settings?.whiteboardRetentionDays ?? 30;
  const { count } = await whiteboardSessionUsecase.purgeExpiredImages({ retentionDays });
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`[whiteboard-retention] purged ${count} expired image(s)`);
  }
}

/** Starts the daily whiteboard-image retention cron. Idempotent + guarded. */
export function startWhiteboardRetentionScheduler() {
  if (task) return;
  task = cron.schedule(CRON_EXPR, () => {
    runRetentionSweep().catch((err) => {
      // eslint-disable-next-line no-console
      console.error(
        "[whiteboard-retention] sweep error:",
        err?.code || err?.message || err,
      );
    });
  });
  // eslint-disable-next-line no-console
  console.log("[whiteboard-retention] daily image cleanup scheduled (03:30)");
}

/** Stops the cron (used on shutdown / in tests). */
export function stopWhiteboardRetentionScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}

export { runRetentionSweep };
