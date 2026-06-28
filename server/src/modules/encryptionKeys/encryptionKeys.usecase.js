// ===========================================================================
// encryptionKeys.usecase — backup-encryption key logic (material stored on Drive).
//
// Principle: the key material is NEVER stored in our DB — it is generated, written
// as a .pem file on a KEY-type Drive account, and only its metadata
// (name/account/Drive file/fingerprint/primary) is persisted. The material is
// never logged. Prisma only via repos.
//
// Save guard order: validate → account exists + type KEY + connected → decode the
// key material + assert 32 bytes → write the .pem to Drive → persist the row +
// set primary if it is the first key (atomically). No audit (no audit infra in Aya).
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { AppError } from "../../shared/errors/AppError.js";
import { DRIVE_ACCOUNT_TYPES, backupMessagesCodes, messagesNames } from "@aya/shared";
import { encryptionKeysRepo } from "./encryptionKeys.repo.js";
import { encryptionKeysDto } from "./encryptionKeys.dto.js";
import { driveAccountsRepo } from "../backups/driveAccounts.repo.js";
import { driveProvider } from "../../infra/backup/providers/drive.js";
import {
  generateKeyBytes,
  fingerprintOf,
  decodeKeyMaterial,
  toPemString,
} from "../../infra/backup/keyMaterial.js";

const TK = messagesNames.backupMessages;

class EncryptionKeysUsecase {
  /** Generates a 32-byte key and returns it (base64) once — never stored. */
  async generate() {
    const key = generateKeyBytes();
    try {
      return { key: key.toString("base64") };
    } finally {
      // Zero-fill the material after encoding (best-effort).
      try { key.fill(0); } catch { /* ignore */ }
    }
  }

  /** Lists keys + each key account's connection state (checked once per account). */
  async list() {
    const rows = await encryptionKeysRepo.list();
    const accountIds = [...new Set(rows.map((r) => r.keyAccountId).filter((id) => id != null))];
    const connectedMap = {};
    for (const accountId of accountIds) {
      try {
        const conn = await driveProvider.checkConnection(accountId);
        connectedMap[accountId] = Boolean(conn.connected);
      } catch {
        connectedMap[accountId] = false;
      }
    }
    return encryptionKeysDto.toList(rows, connectedMap);
  }

  /**
   * Saves a key: verifies the account (exists / KEY / connected) + the key
   * material (32 bytes), writes the .pem to Drive, then persists the fingerprint +
   * sets it primary if it is the first key. Never stores the material.
   */
  async save({ input, authUser }) {
    void authUser; // accepted for parity; no audit module in Aya.
    const keyAccountId = Number(input.keyAccountId);

    const account = await driveAccountsRepo.findById({ id: keyAccountId });
    if (!account) {
      throw new AppError({ statusCode: 404, code: backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND, translationKey: TK });
    }
    if ((account.type || DRIVE_ACCOUNT_TYPES.DB) !== DRIVE_ACCOUNT_TYPES.KEY) {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.KEY_ACCOUNT_REQUIRED, translationKey: TK });
    }

    // The account must be connected so we can write the key file onto it.
    const conn = await driveProvider.checkConnection(keyAccountId);
    if (!conn.connected) {
      throw new AppError({ statusCode: 409, code: backupMessagesCodes.KEY_ACCOUNT_DISCONNECTED, translationKey: TK });
    }

    // Decode the key (tolerates a .pem wrapper) + assert 32 bytes.
    let keyBytes;
    try {
      keyBytes = decodeKeyMaterial(input.key);
    } catch {
      throw new AppError({ statusCode: 422, code: backupMessagesCodes.ENCRYPTION_KEY_INVALID, translationKey: TK });
    }

    let fingerprint;
    let pem;
    let fileName;
    try {
      fingerprint = fingerprintOf(keyBytes);
      pem = toPemString(keyBytes.toString("base64"));
      fileName = `aya-academy-backup-key-${fingerprint.slice(0, 12)}.pem`;
    } finally {
      // Zero-fill the material after deriving the .pem (best-effort).
      try { keyBytes.fill(0); } catch { /* ignore */ }
    }

    // Write the material to Drive (the only place it is stored).
    const driveFileId = await driveProvider.writeTextFile(keyAccountId, fileName, pem);

    // If any step after the file write fails (count/transaction) the Drive file
    // would be orphaned (no row). Best-effort delete it before rethrowing — mirrors
    // the best-effort deletion pattern in remove().
    let created;
    try {
      const existingCount = await encryptionKeysRepo.count();
      const isPrimary = existingCount === 0;

      await prisma.$transaction(async (tx) => {
        created = await encryptionKeysRepo.create({
          data: {
            name: input.name.trim(),
            keyAccountId,
            driveFileId,
            fingerprint,
            isPrimary,
          },
          client: tx,
        });
      });
    } catch (err) {
      await driveProvider.deleteFile(keyAccountId, driveFileId).catch(() => {});
      throw err;
    }

    const full = await encryptionKeysRepo.findById({ id: created.id });
    return encryptionKeysDto.toKeyRow(full, { connected: true });
  }

  /** Sets a key primary (clears the rest) inside a tx. */
  async setPrimary({ id, authUser }) {
    void authUser; // accepted for parity; no audit module in Aya.
    const keyId = Number(id);
    const key = await encryptionKeysRepo.findById({ id: keyId });
    if (!key) {
      throw new AppError({ statusCode: 404, code: backupMessagesCodes.ENCRYPTION_KEY_NOT_FOUND, translationKey: TK });
    }
    await prisma.$transaction(async (tx) => {
      await encryptionKeysRepo.setPrimary({ id: keyId, client: tx });
    });
    return { id: keyId, isPrimary: true };
  }

  /**
   * Deletes a key: best-effort delete the Drive file, then delete the row.
   * We do NOT auto-promote another key — the system may end up with no primary key.
   * Backups linked by FK remain but may become unrestorable (the material is lost).
   */
  async remove({ id, authUser }) {
    void authUser; // accepted for parity; no audit module in Aya.
    const keyId = Number(id);
    const key = await encryptionKeysRepo.findById({ id: keyId });
    if (!key) {
      throw new AppError({ statusCode: 404, code: backupMessagesCodes.ENCRYPTION_KEY_NOT_FOUND, translationKey: TK });
    }

    // Best-effort Drive file delete (the account may be disconnected / file gone).
    if (key.driveFileId && key.keyAccountId != null) {
      try {
        await driveProvider.deleteFile(key.keyAccountId, key.driveFileId);
      } catch {
        /* ignore — does not fail the row delete */
      }
    }

    await prisma.$transaction(async (tx) => {
      await encryptionKeysRepo.delete({ id: keyId, client: tx });
    });

    return { id: keyId };
  }
}

export const encryptionKeysUsecase = new EncryptionKeysUsecase();
export { EncryptionKeysUsecase };
