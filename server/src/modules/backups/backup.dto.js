// backup.dto — output shaping. No secrets leak (no tokens, no cipher/iv/tag).
// driveFileId may be shown (non-sensitive id). storageKey is internal — not leaked.

import { BACKUP_STATUSES, BACKUP_PROVIDERS, backupMessagesCodes } from "@aya/shared";

/**
 * Computes restore eligibility per row and the reason code when blocked.
 * Mirrors backupService.restoreBackup + _preflightAndResolveKey + _downloadViaProvider.
 * Restore now needs two accounts: the key account (to decrypt, always) + the DB
 * account (to download the dump when the local file is missing).
 *  - status must be SUCCESS.
 *  - encryption key: must exist + its account connected (else KEY_FILE_MISSING / KEY_ACCOUNT_DISCONNECTED).
 *  - dump source: the local file → enough; else drive needs a non-deleted file + connected DB account.
 * `extra.accountConnected` is a map (accountId → connected) for all relevant accounts (DB + key accounts).
 */
function computeRestore(b, { localPresent, drivePresent, accountConnected }) {
  if (b.status !== BACKUP_STATUSES.SUCCESS) {
    return { canRestore: false, reasonCode: backupMessagesCodes.NOT_SUCCESSFUL };
  }

  // 1) Key account always required (to decrypt).
  const key = b.encryptionKey || null;
  if (!key || !key.driveFileId) {
    return { canRestore: false, reasonCode: backupMessagesCodes.KEY_FILE_MISSING };
  }
  const keyAccountConnected =
    key.keyAccountId != null && Boolean(accountConnected?.[key.keyAccountId]);
  if (!keyAccountConnected) {
    return { canRestore: false, reasonCode: backupMessagesCodes.KEY_ACCOUNT_DISCONNECTED };
  }

  // 2) Dump source.
  if (localPresent) return { canRestore: true, reasonCode: null };

  if (b.provider === BACKUP_PROVIDERS.DRIVE) {
    if (!drivePresent) {
      return { canRestore: false, reasonCode: backupMessagesCodes.FILE_MISSING_LOCAL };
    }
    const dbConnected = b.driveAccountId != null && Boolean(accountConnected?.[b.driveAccountId]);
    if (!dbConnected) {
      return { canRestore: false, reasonCode: backupMessagesCodes.DB_ACCOUNT_DISCONNECTED };
    }
    return { canRestore: true, reasonCode: null };
  }

  if (b.provider === BACKUP_PROVIDERS.S3) {
    if (!b.storageKey) {
      return { canRestore: false, reasonCode: backupMessagesCodes.STORAGE_KEY_MISSING };
    }
    return { canRestore: true, reasonCode: null };
  }

  // local — no remote download; a missing local file = unavailable.
  return { canRestore: false, reasonCode: backupMessagesCodes.FILE_MISSING_LOCAL };
}

/**
 * A backup row.
 * `extra.localPresent` is computed in the usecase (fs),
 * `extra.accountConnected` is the Drive account connection map (for canRestore).
 */
function toBackupRow(b, extra = {}) {
  if (!b) return null;
  const localPresent = Boolean(extra.localPresent);
  const drivePresent = Boolean(b.driveFileId) && !b.driveDeletedAt;
  const remotePresent = b.provider === BACKUP_PROVIDERS.DRIVE ? drivePresent : Boolean(b.storageKey);
  const fullyDeleted = !localPresent && !remotePresent;
  const { canRestore, reasonCode } = computeRestore(b, {
    localPresent,
    drivePresent,
    accountConnected: extra.accountConnected,
  });
  return {
    id: b.id,
    fileName: b.fileName,
    createdAt: b.createdAt,
    trigger: b.trigger,
    status: b.status,
    provider: b.provider,
    errorMessage: b.errorMessage ?? null,
    driveFileId: b.driveFileId ?? null,
    encrypted: b.encrypted,
    driveAccountEmail: b.driveAccountEmail ?? null,
    encryptionKeyId: b.encryptionKeyId ?? null,
    encryptionKey: b.encryptionKey
      ? {
          id: b.encryptionKey.id,
          name: b.encryptionKey.name,
          fingerprint: b.encryptionKey.fingerprint,
        }
      : null,
    localPresent,
    drivePresent,
    fullyDeleted,
    localDeletedAt: b.localDeletedAt ?? null,
    driveDeletedAt: b.driveDeletedAt ?? null,
    canRestore,
    restoreUnavailableReasonCode: canRestore ? null : reasonCode,
  };
}

/**
 * Maps rows with a local-presence map (id → boolean) and an account-connection
 * map (driveAccountId → connected) — both computed in the usecase.
 */
function toList(rows, localPresenceMap = {}, accountConnected = {}) {
  return rows.map((r) =>
    toBackupRow(r, { localPresent: localPresenceMap[r.id], accountConnected }),
  );
}

/** A Drive account — no encryption fields. connected/hasBackups are computed in the usecase. */
function toDriveAccount(a, { connected, hasBackups } = {}) {
  if (!a) return null;
  return {
    id: a.id,
    email: a.email ?? null,
    label: a.label ?? null,
    type: a.type ?? null,
    isActive: Boolean(a.isActive),
    connected: Boolean(connected),
    needsReconnect: !connected,
    lastConnectedAt: a.lastConnectedAt ?? null,
    hasBackups: Boolean(hasBackups),
  };
}

/** Schema comparison report (for external restore). */
function toSchemaReport(report) {
  if (!report) return null;
  return {
    ok: Boolean(report.ok),
    missingTables: report.missingTables ?? [],
    extraTables: report.extraTables ?? [],
    columnDiffs: report.columnDiffs ?? [],
  };
}

export const backupsDto = { toBackupRow, toList, toDriveAccount, toSchemaReport };
