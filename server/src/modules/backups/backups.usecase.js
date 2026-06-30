// ===========================================================================
// backups.usecase — module-layer orchestration over the backup/drive/scheduler
// infra services.
//
// Heavy work (dump/encrypt/upload/download/restore/schema-check) lives in
// infra/backup. Here: validation, filter `where` building, enrichment with
// localPresent (fs) + Drive connection state, output shaping via DTO. Prisma only
// via repos. No audit (Aya has no audit infra wired).
// ===========================================================================

import fs from "fs";
import path from "path";
import { prisma } from "@aya/db/prisma.client.js";
import { AppError } from "../../shared/errors/AppError.js";
import {
  BACKUP_TRIGGERS,
  BACKUP_PROVIDERS,
  DRIVE_ACCOUNT_TYPES,
  backupMessagesCodes,
  messagesNames,
} from "@aya/shared";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { backupsRepo } from "./backups.repo.js";
import { driveAccountsRepo } from "./driveAccounts.repo.js";
import { backupsDto } from "./backups.dto.js";
import { backupService, BACKUPS_DIR } from "../../infra/backup/backupService.js";
import { driveProvider } from "../../infra/backup/providers/drive.js";
import { getScheduledTime } from "../../infra/backup/scheduler.js";

const TK = messagesNames.backupMessages;

class BackupsUsecase {
  async list({ query }) {
    const where = {};
    const driveAccountId = Number(query.driveAccountId);
    if (Number.isInteger(driveAccountId) && driveAccountId > 0) {
      where.driveAccountId = driveAccountId;
    }
    if (query.status) where.status = query.status;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(`${query.dateFrom}T00:00:00`);
      if (query.dateTo) where.createdAt.lte = new Date(`${query.dateTo}T23:59:59.999`);
    }

    const { page, limit } = paginate({ page: query.page, limit: query.limit });
    // Repo `list` returns the reference shape { items, total, page, pageSize };
    // alias `items` → `rows` here so the local enrichment below is unchanged.
    const { items: rows, total } = await backupsRepo.list({ page, limit, where });

    const localPresenceMap = {};
    for (const r of rows) {
      localPresenceMap[r.id] = fs.existsSync(path.join(BACKUPS_DIR, r.fileName));
    }

    // Drive-account connection state for accounts referenced by this page's rows
    // (DB + key accounts) — to compute canRestore per row. Check each relevant
    // account once to avoid a repeated check per row.
    const accountConnected = {};
    const accountIds = [
      ...new Set(
        rows
          .flatMap((r) => [r.driveAccountId, r.encryptionKey?.keyAccountId])
          .filter((id) => id != null),
      ),
    ];
    for (const accountId of accountIds) {
      try {
        const conn = await driveProvider.checkConnection(accountId);
        accountConnected[accountId] = Boolean(conn.connected);
      } catch {
        accountConnected[accountId] = false;
      }
    }

    let items = backupsDto.toList(rows, localPresenceMap, accountConnected);

    if (query.location && query.location !== "all") {
      items = items.filter((b) => {
        if (query.location === "local") return b.localPresent;
        if (query.location === "drive") return b.drivePresent;
        if (query.location === "deleted") return b.fullyDeleted;
        return true;
      });
    }

    return paginatedResult(items, total, page, limit);
  }

  /** Manual backup. createBackup does not throw — we read the result and raise AppError on failure. */
  async runNow({ input = {}, authUser }) {
    const encryptionKeyId = input.encryptionKeyId ? Number(input.encryptionKeyId) : undefined;
    const result = await backupService.createBackup({
      trigger: BACKUP_TRIGGERS.MANUAL,
      userId: authUser.id,
      encryptionKeyId,
    });
    if (!result.ok) {
      if (result.code === backupMessagesCodes.OPERATION_IN_PROGRESS) {
        throw new AppError({ statusCode: 409, code: backupMessagesCodes.OPERATION_IN_PROGRESS, translationKey: TK });
      }
      throw new AppError({
        statusCode: 500,
        code: result.errorCode || backupMessagesCodes.FAILED,
        translationKey: TK,
        details: { errorCode: result.errorCode, backupId: result.backupId },
      });
    }
    const row = await backupsRepo.findById({ id: result.backupId });
    const localPresent = fs.existsSync(path.join(BACKUPS_DIR, row.fileName));
    // Connection state of the new row's accounts (DB + key) to compute canRestore precisely.
    const accountConnected = {};
    for (const accountId of [row.driveAccountId, row.encryptionKey?.keyAccountId]) {
      if (accountId == null) continue;
      try {
        const conn = await driveProvider.checkConnection(accountId);
        accountConnected[accountId] = Boolean(conn.connected);
      } catch {
        accountConnected[accountId] = false;
      }
    }
    return backupsDto.toBackupRow(row, { localPresent, accountConnected });
  }

  /** Restore — destructive, requires confirm. Smart routing inside backupService. */
  async restore({ input, authUser }) {
    return backupService.restoreBackup({
      backupId: input.backupId,
      userId: authUser.id,
      confirm: input.confirm,
    });
  }

  /**
   * Delete a backup: best-effort file deletion (local + Drive when possible) then
   * delete the row. A failed remote/local file delete does not fail the operation
   * (the file may already be gone).
   */
  async remove({ id, authUser }) {
    void authUser; // accepted for parity; no audit module in Aya.
    const backupId = Number(id);
    const row = await backupsRepo.findById({ id: backupId });
    if (!row) {
      throw new AppError({ statusCode: 404, code: backupMessagesCodes.NOT_FOUND, translationKey: TK });
    }

    // 1) Local file (best-effort).
    try {
      const localPath = path.join(BACKUPS_DIR, row.fileName);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    } catch {
      /* ignore — the file may be deleted/locked */
    }

    // 2) Drive file (best-effort) when the destination is drive and a file + account exist.
    if (
      row.provider === BACKUP_PROVIDERS.DRIVE &&
      row.driveFileId &&
      !row.driveDeletedAt &&
      row.driveAccountId != null
    ) {
      try {
        await driveProvider.deleteFile(row.driveAccountId, row.driveFileId);
      } catch {
        /* ignore — the remote file may be deleted or the account disconnected */
      }
    }

    // 3) Delete the row.
    await prisma.$transaction(async (tx) => {
      await backupsRepo.delete({ id: backupId, client: tx });
    });

    return { id: backupId };
  }

  // ----- Drive accounts ---------------------------------------------------

  async driveAccounts({ query = {} } = {}) {
    const accounts = await driveAccountsRepo.list({ filters: { search: query.search, type: query.type } });
    const out = [];
    for (const a of accounts) {
      const conn = await driveProvider.checkConnection(a.id);
      const hasBackups = (await backupsRepo.countByAccount({ accountId: a.id })) > 0;
      out.push(backupsDto.toDriveAccount(a, { connected: conn.connected, hasBackups }));
    }
    return out;
  }

  async setActiveAccount({ id, authUser }) {
    void authUser; // accepted for parity; no audit module in Aya.
    const accountId = Number(id);
    const account = await driveAccountsRepo.findById({ id: accountId });
    if (!account) throw new AppError({ statusCode: 404, code: backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND, translationKey: TK });
    await prisma.$transaction(async (tx) => {
      await driveAccountsRepo.setActive({ id: accountId, client: tx });
    });
    return { id: accountId, isActive: true };
  }

  async checkAccount({ id }) {
    const accountId = Number(id);
    const account = await driveAccountsRepo.findById({ id: accountId });
    if (!account) throw new AppError({ statusCode: 404, code: backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND, translationKey: TK });
    const conn = await driveProvider.checkConnection(accountId);
    return { id: accountId, connected: conn.connected, errorCode: conn.errorCode ?? null };
  }

  async disconnectAccount({ id, authUser }) {
    void authUser; // accepted for parity; no audit module in Aya.
    const accountId = Number(id);
    const account = await driveAccountsRepo.findById({ id: accountId });
    if (!account) throw new AppError({ statusCode: 404, code: backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND, translationKey: TK });
    await driveProvider.disconnect(accountId);
    return { id: accountId, connected: false };
  }

  async removeAccount({ id, authUser }) {
    void authUser; // accepted for parity; no audit module in Aya.
    const accountId = Number(id);
    const account = await driveAccountsRepo.findById({ id: accountId });
    if (!account) throw new AppError({ statusCode: 404, code: backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND, translationKey: TK });
    const count = await backupsRepo.countByAccount({ accountId });
    if (count > 0) {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.DRIVE_ACCOUNT_HAS_BACKUPS, translationKey: TK });
    }
    await prisma.$transaction(async (tx) => {
      await driveAccountsRepo.delete({ id: accountId, client: tx });
    });
    return { id: accountId };
  }

  // ----- OAuth ------------------------------------------------------------

  async getDriveAuthUrl({ reconnectId, type, userId } = {}) {
    // The new account type (KEY|DB) is carried in `state`; default DB (back-compat).
    // The initiating userId is passed for tracing (stored in the state entry).
    const accountType = type === DRIVE_ACCOUNT_TYPES.KEY ? DRIVE_ACCOUNT_TYPES.KEY : DRIVE_ACCOUNT_TYPES.DB;
    const { url, state } = await driveProvider.getAuthUrl({
      reconnectAccountId: reconnectId,
      accountType,
      userId,
    });
    return { authUrl: url, state };
  }

  async handleDriveCallback({ input }) {
    if (input.error || !input.code) {
      throw new AppError({ statusCode: 400, code: backupMessagesCodes.DRIVE_AUTH_FAILED, translationKey: TK });
    }
    const result = await driveProvider.handleCallback(input.code, input.state);
    return { connected: true, accountId: result.accountId, email: result.email };
  }

  // ----- External restore -------------------------------------------------

  async restoreExternalCheck({ file, input }) {
    if (!file) {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.EXTERNAL_FILE_REQUIRED, translationKey: TK });
    }
    try {
      // The key is required (base64 or .pem) — the 32-byte assertion happens in the
      // service after stripping any wrapper.
      const { token, expiresAt, report } = await backupService.checkExternalFile({
        tmpEncPath: file.path,
        externalKey: input.externalKey,
      });
      return { token, expiresAt, report: backupsDto.toSchemaReport(report) };
    } finally {
      try {
        if (file && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch {
        /* ignore */
      }
    }
  }

  async restoreExternalCommit({ input, authUser }) {
    return backupService.commitExternalRestore({
      token: input.token,
      confirm: input.confirm,
      userId: authUser.id,
    });
  }

  // ----- Status -----------------------------------------------------------

  async status() {
    const last = await backupsRepo.lastSuccessful();
    const accounts = await driveAccountsRepo.list();
    const active = accounts.find((a) => a.isActive);
    return {
      lastSuccessfulAt: last ? last.createdAt : null,
      lastSuccessfulFileName: last ? last.fileName : null,
      scheduledTimeOfDay: getScheduledTime(),
      accounts: {
        total: accounts.length,
        active: active ? { id: active.id, email: active.email, label: active.label } : null,
      },
    };
  }
}

export const backupsUsecase = new BackupsUsecase();
export { BackupsUsecase };
