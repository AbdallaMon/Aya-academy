// ===========================================================================
// backup/fsUtils — fs/path helpers for the backup subsystem: the local backups
// directory, dated file names, best-effort unlink/rmdir, and the boot-time sweep
// of leftover external-restore temp dirs (decrypted DB text). No business logic.
// ===========================================================================

import fs from "fs";
import os from "os";
import path from "path";
import { ENV } from "../../config/env.js";

/** Local directory for .enc files (absolute or relative to server cwd). */
export const BACKUPS_DIR = path.isAbsolute(ENV.backup.dir)
  ? ENV.backup.dir
  : path.resolve(process.cwd(), ENV.backup.dir);

export const EXTERNAL_TMP_PREFIX = "aya-academy-external-"; // temp check dir prefix (for the sweep)

export function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

/** aya-academy-YYYY-MM-DD-HHmm.enc */
export function datedFileName(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
  return `aya-academy-${stamp}.enc`;
}

export function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore temp delete errors */
  }
}

/** Removes a whole temp dir (best-effort) — ensures the decrypted text goes with it. */
export function safeRmDir(dir) {
  try {
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore temp dir delete errors */
  }
}

/**
 * Sweeps leftover external-restore check dirs (decrypted DB text) left by a
 * previous crash. Called on boot (server/scheduler) — deletes any dir with the
 * prefix in os.tmpdir(). best-effort: does not throw. Exported for the boot point.
 */
export function sweepStaleExternalTempDirs() {
  const tmpRoot = os.tmpdir();
  let entries = [];
  try {
    entries = fs.readdirSync(tmpRoot);
  } catch {
    return;
  }
  for (const name of entries) {
    if (!name.startsWith(EXTERNAL_TMP_PREFIX)) continue;
    const full = path.join(tmpRoot, name);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) safeRmDir(full);
      else safeUnlink(full); // leftover from an older format (a .sql file directly)
    } catch {
      /* ignore */
    }
  }
}
