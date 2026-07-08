// ===========================================================================
// backupService — core backup/restore orchestration (independent of Express).
// provider-abstracted: chooses the storage destination from ENV.backup.provider
// (drive | s3 | local).
//
// createBackup:  dump -> encrypt -> write locally (dated .enc) -> Backup row
//                (provider/storageKey) -> upload via the chosen provider ->
//                retention. Does not throw over the edge (cron-safe): returns a
//                result object and records FAILED on failure.
// restoreBackup: smart routing — local if present, else from the remote
//                destination via the provider.
// checkExternalFile / commitExternalRestore: restore from an external .enc file
//                with a schema check.
//
// retention: Backup rows are not deleted — they are marked localDeletedAt /
// driveDeletedAt. A simple in-memory mutex prevents two destructive operations
// from running at once (OPERATION_IN_PROGRESS).
//
// NOTE (Aya): no AuditLog module is wired in this codebase, so no audit logging
// is performed here (other modules also do not audit). Retention limits + the
// scheduled time come from the env, not a Settings table.
// ===========================================================================

import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { AppError } from "../../shared/errors/AppError.js";
import { ENV } from "../../config/env.js";
import {
  BACKUP_TRIGGERS,
  BACKUP_STATUSES,
  BACKUP_PROVIDERS,
  DRIVE_ACCOUNT_TYPES,
  backupMessagesCodes,
  messagesNames,
} from "@aya/shared";
import { createDump } from "./dump.js";
import { importSql } from "./restore.js";
import { encryptToFileBuffer, decryptFromFileBuffer } from "./fileFormat.js";
import { decodeKeyMaterial, fingerprintOf } from "./keyMaterial.js";
import { extractSchemaFromSql, compareSchemas } from "./schemaCheck.js";
import { backupsRepo } from "../../modules/backups/backup.repo.js";
import { driveAccountsRepo } from "../../modules/backups/driveAccount.repo.js";
import { encryptionKeysRepo } from "../../modules/encryptionKeys/encryptionKeys.repo.js";
import { driveProvider } from "./providers/drive.js";
import { s3BackupProvider } from "./providers/s3.js";
import { localBackupProvider } from "./providers/local.js";

const TK = messagesNames.backupMessages;

/** Local directory for .enc files (absolute or relative to server cwd). */
export const BACKUPS_DIR = path.isAbsolute(ENV.backup.dir)
  ? ENV.backup.dir
  : path.resolve(process.cwd(), ENV.backup.dir);

const DEFAULT_RETENTION = 200;
const EXTERNAL_CHECK_TTL_MS = 5 * 60 * 1000; // 5 min — short check->commit window (decrypted text)
const EXTERNAL_TMP_PREFIX = "aya-academy-external-"; // temp check dir prefix (for the sweep)

/** The chosen provider (drive by default). */
function backupProviderName() {
  return ENV.backup.provider || BACKUP_PROVIDERS.DRIVE;
}

function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

/** aya-academy-YYYY-MM-DD-HHmm.enc */
function datedFileName(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
  return `aya-academy-${stamp}.enc`;
}

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore temp delete errors */
  }
}

/** Removes a whole temp dir (best-effort) — ensures the decrypted text goes with it. */
function safeRmDir(dir) {
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

class BackupService {
  constructor() {
    this._opInProgress = false;
    this._externalChecks = new Map(); // token -> { tmpDir, sqlPath, report, expiresAt }
  }

  _sweepExternalChecks() {
    const now = Date.now();
    for (const [token, entry] of this._externalChecks.entries()) {
      if (entry.expiresAt <= now) {
        safeRmDir(entry.tmpDir);
        this._externalChecks.delete(token);
      }
    }
  }

  /**
   * Resolves the encryption key for a new backup + fetches its material from
   * Drive and verifies the fingerprint.
   * - manual: encryptionKeyId passed → its account must be connected (KEY_ACCOUNT_DISCONNECTED).
   * - auto: the primary key → absent = NO_PRIMARY_KEY (no backup is created).
   * Throws a language-neutral AppError on any failure.
   * @returns {Promise<{ key: object, keyBytes: Buffer }>}
   */
  async _resolveEncryptionKey({ encryptionKeyId }) {
    let key;
    if (encryptionKeyId != null) {
      key = await encryptionKeysRepo.findById({ id: encryptionKeyId });
      if (!key) {
        throw new AppError({ statusCode: 404, code: backupMessagesCodes.ENCRYPTION_KEY_NOT_FOUND, translationKey: TK });
      }
    } else {
      key = await encryptionKeysRepo.findPrimary();
      if (!key) {
        throw new AppError({ statusCode: 409, code: backupMessagesCodes.NO_PRIMARY_KEY, translationKey: TK });
      }
    }

    // The key's account must be connected so we can fetch the material.
    const conn = await driveProvider.checkConnection(key.keyAccountId);
    if (!conn.connected) {
      throw new AppError({
        statusCode: 409,
        code: backupMessagesCodes.KEY_ACCOUNT_DISCONNECTED,
        translationKey: TK,
        details: { accountId: key.keyAccountId },
      });
    }

    // Fetch the key file from Drive + decode the material.
    let pem;
    try {
      pem = await driveProvider.readTextFile(key.keyAccountId, key.driveFileId);
    } catch {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.KEY_FILE_MISSING, translationKey: TK });
    }
    let keyBytes;
    try {
      keyBytes = decodeKeyMaterial(pem);
    } catch {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.ENCRYPTION_KEY_INVALID, translationKey: TK });
    }

    // Fingerprint check (the fetched material matches the stored fingerprint).
    if (fingerprintOf(keyBytes) !== key.fingerprint) {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.KEY_FINGERPRINT_MISMATCH, translationKey: TK });
    }

    return { key, keyBytes };
  }

  /**
   * Creates a full backup. Does not throw over the edge — returns a result object.
   * @param {object} opts
   * @param {string} [opts.trigger]
   * @param {number} [opts.userId]
   * @param {number} [opts.encryptionKeyId]  specific key (manual); absent = primary (auto).
   * @returns {Promise<{ ok:boolean, backupId?:number, fileName?:string, errorCode?:string, code?:string }>}
   */
  async createBackup({ trigger = BACKUP_TRIGGERS.MANUAL, userId, encryptionKeyId }) {
    void userId; // accepted for parity with the scheduler; no audit module in Aya.
    if (this._opInProgress) {
      return { ok: false, code: backupMessagesCodes.OPERATION_IN_PROGRESS };
    }
    this._opInProgress = true;

    const provider = backupProviderName();
    const fileName = datedFileName();
    const localPath = path.join(BACKUPS_DIR, fileName);
    let dumpPath = null;
    let keyBytes = null; // raised to scope so we can zero-fill it in finally after encryption.

    try {
      ensureBackupsDir();

      // 0) Resolve the key + fetch its material from Drive (before any dump). Throws
      //    a language-neutral code.
      let key;
      ({ key, keyBytes } = await this._resolveEncryptionKey({ encryptionKeyId }));

      // The dump's storage destination = the active DB-type account (for drive provider).
      let dbAccount = null;
      if (provider === BACKUP_PROVIDERS.DRIVE) {
        dbAccount = await this._resolveActiveDbAccount();
      }

      // 1) dump -> 2) encrypt and write .enc locally with the fetched key + its
      //    fingerprint in the header
      dumpPath = await createDump();
      const plain = fs.readFileSync(dumpPath);
      const encFile = encryptToFileBuffer(plain, keyBytes, {
        keyId: key.id,
        keyFingerprint: key.fingerprint,
      });
      fs.writeFileSync(localPath, encFile);
      safeUnlink(dumpPath);
      dumpPath = null;

      // 3) Backup row (encrypted=true, provider, storageKey defaults to the local name, key)
      const row = await backupsRepo.create({
        data: {
          fileName,
          trigger,
          status: BACKUP_STATUSES.SUCCESS,
          encrypted: true,
          provider,
          storageKey: fileName,
          encryptionKeyId: key.id,
        },
      });

      // 4) Upload via the chosen provider (failure does not fail the local backup)
      await this._uploadViaProvider({ provider, row, localPath, fileName, dbAccount });

      // 5) retention (mark the excess)
      await this._applyRetention(provider);

      return { ok: true, backupId: row.id, fileName };
    } catch (err) {
      safeUnlink(dumpPath);
      const errorCode = err?.code || backupMessagesCodes.FAILED;

      let backupId;
      try {
        const row = await backupsRepo.create({
          data: {
            fileName,
            trigger,
            status: BACKUP_STATUSES.FAILED,
            errorMessage: errorCode, // stores the language-neutral code (no raw prose)
            encrypted: true,
            provider,
          },
        });
        backupId = row.id;
      } catch {
        /* even if writing the row fails, do not crash the cron */
      }

      // eslint-disable-next-line no-console
      console.error("[backup] backup failed:", errorCode);
      return { ok: false, backupId, fileName, errorCode };
    } finally {
      // Zero-fill the key material after encryption (best-effort — does not change control flow).
      if (keyBytes) {
        try { keyBytes.fill(0); } catch { /* ignore */ }
      }
      this._opInProgress = false;
    }
  }

  /**
   * Resolves the active DB-type account (the dump's storage destination). Throws
   * DRIVE_NOT_CONNECTED if there is no active DB account — we do not create a
   * backup with no destination on Drive.
   */
  async _resolveActiveDbAccount() {
    const accounts = await driveAccountsRepo.list();
    const dbAccount = accounts.find(
      (a) => a.isActive && (a.type || DRIVE_ACCOUNT_TYPES.DB) === DRIVE_ACCOUNT_TYPES.DB,
    );
    if (!dbAccount) {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.DRIVE_NOT_CONNECTED, translationKey: TK });
    }
    return dbAccount;
  }

  /** Uploads the backup via the chosen provider and updates the Backup row with destination info. */
  async _uploadViaProvider({ provider, row, localPath, fileName, dbAccount }) {
    try {
      if (provider === BACKUP_PROVIDERS.DRIVE) {
        const active = dbAccount || (await this._resolveActiveDbAccount());
        const driveFileId = await driveProvider.uploadFile(active.id, localPath, fileName);
        await backupsRepo.update({
          id: row.id,
          data: {
            driveFileId,
            driveAccountId: active.id,
            driveAccountEmail: active.email,
            storageKey: driveFileId,
          },
        });
      } else if (provider === BACKUP_PROVIDERS.S3) {
        const storageKey = await s3BackupProvider.uploadFile(localPath, fileName);
        await backupsRepo.update({ id: row.id, data: { storageKey } });
      } else {
        // local — the backup is kept locally only.
        await localBackupProvider.uploadFile(localPath, fileName);
      }
    } catch (uploadErr) {
      const code = uploadErr?.code || backupMessagesCodes.STORAGE_UPLOAD_FAILED;
      // eslint-disable-next-line no-console
      console.warn("[backup] remote upload failed:", code);
      if (provider === BACKUP_PROVIDERS.DRIVE && code === backupMessagesCodes.DRIVE_AUTH_FAILED) {
        try {
          const active = await driveAccountsRepo.findActive();
          if (active) {
            await driveAccountsRepo.update({
              id: active.id,
              data: { lastErrorCode: backupMessagesCodes.DRIVE_AUTH_FAILED },
            });
          }
        } catch {
          /* marking the account is secondary */
        }
      }
    }
  }

  /** Restores a specific backup (destructive) with smart routing. Requires confirm=true. */
  async restoreBackup({ backupId, userId, confirm }) {
    void userId; // accepted for parity; no audit module in Aya.
    if (confirm !== true) {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.RESTORE_CONFIRM_REQUIRED, translationKey: TK });
    }
    if (this._opInProgress) {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.OPERATION_IN_PROGRESS, translationKey: TK });
    }
    this._opInProgress = true;
    let keyBytes = null; // raised to scope so we can zero-fill it in finally after decryption.

    try {
      const row = await backupsRepo.findById({ id: backupId });
      if (!row) throw new AppError({ statusCode: 404, code: backupMessagesCodes.NOT_FOUND, translationKey: TK });
      if (row.status !== BACKUP_STATUSES.SUCCESS) {
        throw new AppError({ statusCode: 422, code: backupMessagesCodes.FILE_MISSING, translationKey: TK });
      }

      const localPath = path.join(BACKUPS_DIR, row.fileName);
      const localPresent = fs.existsSync(localPath);

      // Preflight: verify the required accounts are connected (the key account
      // always + the DB account when the local file is missing). If either is
      // disconnected → throw ACCOUNTS_RECONNECT_REQUIRED with the list of accounts
      // to reconnect (the frontend shows them + a retry button).
      keyBytes = await this._preflightAndResolveKey({ row, localPresent });

      let plain;
      if (localPresent) {
        plain = decryptFromFileBuffer(fs.readFileSync(localPath), keyBytes);
      } else {
        const buf = await this._downloadViaProvider(row);
        if (!buf) {
          throw new AppError({ statusCode: 404, code: backupMessagesCodes.RESTORE_SOURCE_UNAVAILABLE, translationKey: TK });
        }
        plain = decryptFromFileBuffer(buf, keyBytes);
      }

      // Snapshot the backup catalog + Drive accounts before import, and reconcile after.
      const snapshot = await this._snapshotCatalog();

      let tmpDir = null;
      try {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aya-academy-restore-"));
        const tmpSql = path.join(tmpDir, "restore.sql");
        fs.writeFileSync(tmpSql, plain);
        await importSql(tmpSql);
      } finally {
        safeRmDir(tmpDir);
      }

      await this._reconcileCatalog(snapshot);

      return { ok: true, backupId: row.id, fileName: row.fileName };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        statusCode: 500,
        code: backupMessagesCodes.RESTORE_FAILED,
        translationKey: TK,
        details: { error: err?.message },
      });
    } finally {
      // Zero-fill the key material after decryption (best-effort).
      if (keyBytes) {
        try { keyBytes.fill(0); } catch { /* ignore */ }
      }
      this._opInProgress = false;
    }
  }

  /**
   * Restore preflight: verifies the key account connection (always) and the DB
   * account (when the local file is missing), then fetches the key material and
   * verifies the fingerprint. Collects all disconnected accounts and throws
   * ACCOUNTS_RECONNECT_REQUIRED with the list (the frontend shows the list).
   * @returns {Promise<Buffer>} the 32-byte key material for decryption.
   */
  async _preflightAndResolveKey({ row, localPresent }) {
    const accountsToReconnect = [];

    // 1) Key account (always required to decrypt).
    if (row.encryptionKeyId == null) {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.ENCRYPTION_KEY_NOT_FOUND, translationKey: TK });
    }
    const key = await encryptionKeysRepo.findById({ id: row.encryptionKeyId });
    if (!key) {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.ENCRYPTION_KEY_NOT_FOUND, translationKey: TK });
    }
    const keyConn = await driveProvider.checkConnection(key.keyAccountId);
    if (!keyConn.connected) {
      accountsToReconnect.push({
        id: key.keyAccountId,
        email: key.keyAccount?.email ?? null,
        type: DRIVE_ACCOUNT_TYPES.KEY,
      });
    }

    // 2) DB account (required only if the local file is missing — we must download the dump).
    if (!localPresent && row.provider === BACKUP_PROVIDERS.DRIVE && row.driveAccountId != null) {
      const dbConn = await driveProvider.checkConnection(row.driveAccountId);
      if (!dbConn.connected) {
        accountsToReconnect.push({
          id: row.driveAccountId,
          email: row.driveAccountEmail ?? null,
          type: DRIVE_ACCOUNT_TYPES.DB,
        });
      }
    }

    if (accountsToReconnect.length > 0) {
      throw new AppError({
        statusCode: 409,
        code: backupMessagesCodes.ACCOUNTS_RECONNECT_REQUIRED,
        translationKey: TK,
        details: { accountsToReconnect },
      });
    }

    // Account connected → fetch the material and verify the fingerprint.
    let pem;
    try {
      pem = await driveProvider.readTextFile(key.keyAccountId, key.driveFileId);
    } catch {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.KEY_FILE_MISSING, translationKey: TK });
    }
    let keyBytes;
    try {
      keyBytes = decodeKeyMaterial(pem);
    } catch {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.ENCRYPTION_KEY_INVALID, translationKey: TK });
    }
    if (fingerprintOf(keyBytes) !== key.fingerprint) {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.KEY_FINGERPRINT_MISMATCH, translationKey: TK });
    }
    return keyBytes;
  }

  /** Downloads a backup from the remote destination per the row's provider. Throws DRIVE_RECONNECT_REQUIRED when needed. */
  async _downloadViaProvider(row) {
    if (row.provider === BACKUP_PROVIDERS.DRIVE) {
      const drivePresent = Boolean(row.driveFileId) && !row.driveDeletedAt;
      if (!drivePresent) return null;
      if (row.driveAccountId == null) {
        throw new AppError({
          statusCode: 409,
          code: backupMessagesCodes.DRIVE_RECONNECT_REQUIRED,
          translationKey: TK,
          details: { accountId: null, email: row.driveAccountEmail ?? null },
        });
      }
      const conn = await driveProvider.checkConnection(row.driveAccountId);
      if (!conn.connected) {
        throw new AppError({
          statusCode: 409,
          code: backupMessagesCodes.DRIVE_RECONNECT_REQUIRED,
          translationKey: TK,
          details: { accountId: row.driveAccountId, email: row.driveAccountEmail ?? null },
        });
      }
      return driveProvider.downloadFile(row.driveAccountId, row.driveFileId);
    }
    if (row.provider === BACKUP_PROVIDERS.S3) {
      if (!row.storageKey) return null;
      return s3BackupProvider.downloadFile(row.storageKey);
    }
    // local — no remote download; a missing local file = unavailable.
    return null;
  }

  /**
   * Checks an external .enc file: decrypt with a hand-entered key -> schema
   * compare -> a temp token. The key is required now (no default system backup key).
   * Tolerates raw base64 or a .pem wrapper.
   */
  async checkExternalFile({ tmpEncPath, externalKey }) {
    this._sweepExternalChecks();

    let keyBytes;
    try {
      keyBytes = decodeKeyMaterial(externalKey);
    } catch {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.RESTORE_EXTERNAL_INVALID_KEY, translationKey: TK });
    }

    let plain;
    try {
      const fileBuffer = fs.readFileSync(tmpEncPath);
      plain = decryptFromFileBuffer(fileBuffer, keyBytes);
    } catch {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.RESTORE_EXTERNAL_DECRYPT_FAILED, translationKey: TK });
    } finally {
      // Zero-fill the key material after decryption (best-effort).
      try { keyBytes.fill(0); } catch { /* ignore */ }
    }

    // Write the decrypted text inside a per-run dir (like the local restore path)
    // so we delete the whole dir on commit/failure/sweep — we never leave DB text
    // exposed in os.tmpdir().
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), EXTERNAL_TMP_PREFIX));
    const sqlPath = path.join(tmpDir, "external.sql");
    let report;
    try {
      fs.writeFileSync(sqlPath, plain, { mode: 0o600 });

      const dumpSchema = extractSchemaFromSql(plain.toString("utf8"));
      const dbSchema = await backupsRepo.getCurrentSchema();
      report = compareSchemas(dumpSchema, dbSchema);
    } catch (err) {
      safeRmDir(tmpDir); // failed before registering the token → do not leave the dir orphaned
      throw err;
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + EXTERNAL_CHECK_TTL_MS);
    this._externalChecks.set(token, { tmpDir, sqlPath, report, expiresAt: expiresAt.getTime() });

    return { token, expiresAt, report };
  }

  /** Imports an external .enc file after the check (via token). Destructive → mutex + confirm. */
  async commitExternalRestore({ token, confirm, userId }) {
    void userId; // accepted for parity; no audit module in Aya.
    if (confirm !== true) {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.RESTORE_CONFIRM_REQUIRED, translationKey: TK });
    }
    if (this._opInProgress) {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.OPERATION_IN_PROGRESS, translationKey: TK });
    }

    this._sweepExternalChecks();
    const entry = this._externalChecks.get(token);
    if (!entry) {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.EXTERNAL_CHECK_TOKEN_INVALID, translationKey: TK });
    }
    if (!entry.report.ok) {
      throw new AppError({
        statusCode: 422,
        code: backupMessagesCodes.RESTORE_SCHEMA_MISMATCH,
        translationKey: TK,
        details: entry.report,
      });
    }

    this._opInProgress = true;
    try {
      const snapshot = await this._snapshotCatalog();
      await importSql(entry.sqlPath);
      await this._reconcileCatalog(snapshot);
      return { ok: true };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        statusCode: 500,
        code: backupMessagesCodes.RESTORE_FAILED,
        translationKey: TK,
        details: { error: err?.message },
      });
    } finally {
      safeRmDir(entry.tmpDir);
      this._externalChecks.delete(token);
      this._opInProgress = false;
    }
  }

  /** retention: mark excess backups locally (localDeletedAt) and on Drive (driveDeletedAt). */
  async _applyRetention(provider) {
    const localKeep = ENV.backup.retentionMax || DEFAULT_RETENTION;
    const driveKeep = ENV.backup.driveRetentionMax ?? null;

    const staleLocal = await backupsRepo.findStaleLocal({ keep: localKeep });
    for (const old of staleLocal) {
      const p = path.join(BACKUPS_DIR, old.fileName);
      if (!fs.existsSync(p)) continue;
      safeUnlink(p);
      try {
        await backupsRepo.update({ id: old.id, data: { localDeletedAt: new Date() } });
      } catch {
        /* ignore */
      }
    }

    // Remote delete only for drive (it has a dedicated limit + file id). s3/local: no remote delete here.
    if (provider === BACKUP_PROVIDERS.DRIVE && driveKeep != null) {
      const staleDrive = await backupsRepo.findStaleDrive({ keep: driveKeep });
      for (const old of staleDrive) {
        try {
          await driveProvider.deleteFile(old.driveAccountId, old.driveFileId);
        } catch {
          /* a failed Drive delete does not fail the operation */
        }
        try {
          await backupsRepo.update({ id: old.id, data: { driveDeletedAt: new Date() } });
        } catch {
          /* ignore */
        }
      }
    }
  }

  async _snapshotCatalog() {
    const [backups, driveAccounts] = await Promise.all([
      backupsRepo.findAll(),
      driveAccountsRepo.findAll(),
    ]);
    return { backups, driveAccounts };
  }

  async _reconcileCatalog(snapshot) {
    if (!snapshot) return;
    try {
      const missingAccounts = [];
      for (const a of snapshot.driveAccounts || []) {
        let exists = null;
        if (a.googleUserId) exists = await driveAccountsRepo.findByGoogleUserId({ googleUserId: a.googleUserId });
        if (!exists && a.email) exists = await driveAccountsRepo.findByEmail({ email: a.email });
        if (!exists) missingAccounts.push(a);
      }
      if (missingAccounts.length > 0) {
        await driveAccountsRepo.reinsertMany({ rows: missingAccounts });
      }

      const missingBackups = [];
      for (const b of snapshot.backups || []) {
        const exists = await backupsRepo.findByFileName({ fileName: b.fileName });
        if (!exists) missingBackups.push(b);
      }
      if (missingBackups.length > 0) {
        await backupsRepo.reinsertMany({ rows: missingBackups });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[restore] catalog reconcile failed:", err?.message || err);
    }
  }
}

export const backupService = new BackupService();
export { BackupService };
