// ===========================================================================
// scheduler — daily cron for automatic backups at ENV.backup.timeOfDay (HH:mm).
//
// startScheduler():  called on server boot IF ENV.backup.enabled (guarded — does
//                    not break boot). node-cron only (no Redis/BullMQ).
//
// There is no Settings model in Aya — the time comes from the env, so there is
// no runtime reschedule path. Runs backupService.createBackup({ trigger: AUTO })
// which never throws over the edge, so the cron never crashes even if a backup fails.
// ===========================================================================

import cron from "node-cron";
import { BACKUP_TRIGGERS } from "@aya/shared";
import { ENV } from "../../config/env.js";
import { backupService, sweepStaleExternalTempDirs } from "./backupService.js";

// System user id for automatic operations (the seeded admin id=1). null is fine.
const SYSTEM_USER_ID = 1;
const DEFAULT_TIME = "02:00";

let task = null;
let currentTime = null;

/** Converts "HH:mm" to a cron expression "m H * * *". Returns null if invalid. */
function toCronExpr(hhmm) {
  if (typeof hhmm !== "string") return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${minute} ${hour} * * *`;
}

function readTime() {
  return ENV.backup.timeOfDay || DEFAULT_TIME;
}

function schedule(hhmm) {
  const expr = toCronExpr(hhmm);
  if (!expr) {
    // eslint-disable-next-line no-console
    console.warn(`[scheduler] invalid backup time (${hhmm}) — using default ${DEFAULT_TIME}`);
    return schedule(DEFAULT_TIME);
  }
  if (task) {
    task.stop();
    task = null;
  }
  task = cron.schedule(expr, () => {
    backupService
      .createBackup({ trigger: BACKUP_TRIGGERS.AUTO, userId: SYSTEM_USER_ID })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[scheduler] unexpected auto-backup error:", err?.code || err?.message);
      });
  });
  currentTime = hhmm;
  // eslint-disable-next-line no-console
  console.log(`[scheduler] auto-backup scheduled daily at ${hhmm}`);
}

/** Starts the scheduler from the env. Guarded — does not throw. */
export async function startScheduler() {
  // Sweep leftover external-restore check temp dirs (decrypted DB text) left by a
  // previous crash.
  try {
    sweepStaleExternalTempDirs();
  } catch {
    /* sweep is best-effort — does not break boot */
  }
  schedule(readTime());
}

/** For the status panel: the current scheduled time. */
export function getScheduledTime() {
  return currentTime || readTime();
}

export { toCronExpr };
