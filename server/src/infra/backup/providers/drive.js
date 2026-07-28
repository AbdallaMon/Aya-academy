// ===========================================================================
// drive provider — Google Drive integration (OAuth + upload/download/delete) via
// googleapis. account-aware: every function operates on a specific accountId.
//
// Principles (shared-security):
//  - Least privilege: scope = drive.file (+ openid email only to fetch the email).
//  - The refresh token is stored encrypted at-rest on the DriveAccount row
//    (crypto). No Prisma here directly — all I/O goes through driveAccountsRepo.
//  - Never log any token/secret. 401/403 errors → DRIVE_AUTH_FAILED.
//  - Boot-safe: googleapis is loaded lazily (dynamic import) so it is not forced
//    to load when Drive is unused; building the OAuth client throws
//    DRIVE_NOT_CONFIGURED when env is absent.
// ===========================================================================

import crypto from "crypto";
import fs from "fs";
import { Readable } from "stream";
import { AppError } from "../../../shared/errors/AppError.js";
import { ENV } from "../../../config/env.js";
import { backupMessagesCodes, messagesNames, DRIVE_ACCOUNT_TYPES } from "@ayah/shared";
import { encrypt, decrypt } from "../../../shared/crypto/crypto.js";
import { driveAccountsRepo } from "../../../modules/backups/driveAccount.repo.js";
import { encryptionKeysRepo } from "../../../modules/encryptionKeys/encryptionKeys.repo.js";

const TK = messagesNames.backupMessages;
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const OAUTH_SCOPES = [DRIVE_SCOPE, "openid", "https://www.googleapis.com/auth/userinfo.email"];
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getGoogle() {
  const { google } = await import("googleapis");
  return google;
}

async function buildOAuthClient() {
  const clientId = ENV.google.clientId;
  const clientSecret = ENV.google.clientSecret;
  const redirectUri = ENV.google.redirectUri;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new AppError({ statusCode: 400, code: backupMessagesCodes.DRIVE_NOT_CONFIGURED, translationKey: TK });
  }
  const google = await getGoogle();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

class DriveProvider {
  constructor() {
    // Pending state between the connect button and the callback — a Map keyed by
    // the random state value (CSRF + reconnect purpose + account type + initiator).
    // Each entry: { reconnectAccountId, accountType, userId, expiresAt }
    // single-use (deleted on verify) + TTL (expired ones swept). A Map suffices
    // for a single-process app.
    this._pendingStates = new Map();
  }

  /** Sweeps expired state entries (best-effort, called on create/verify). */
  _sweepStates() {
    const now = Date.now();
    for (const [value, entry] of this._pendingStates.entries()) {
      if (entry.expiresAt <= now) this._pendingStates.delete(value);
    }
  }

  /**
   * @param {object} [opts]
   * @param {number} [opts.reconnectAccountId]  reconnect path for an existing account.
   * @param {"KEY"|"DB"} [opts.accountType]     new account type (passed via state, default DB).
   * @param {number} [opts.userId]              the user initiating the flow (for tracing/audit).
   */
  async getAuthUrl({ reconnectAccountId, accountType, userId } = {}) {
    const oauth2 = await buildOAuthClient();
    this._sweepStates();
    const state = crypto.randomBytes(16).toString("hex");
    const type = accountType === DRIVE_ACCOUNT_TYPES.KEY ? DRIVE_ACCOUNT_TYPES.KEY : DRIVE_ACCOUNT_TYPES.DB;
    this._pendingStates.set(state, {
      reconnectAccountId: reconnectAccountId ?? undefined,
      accountType: type,
      userId: userId ?? null,
      expiresAt: Date.now() + STATE_TTL_MS,
    });
    const url = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: OAUTH_SCOPES,
      state,
    });
    return { url, state };
  }

  _verifyState(state) {
    this._sweepStates();
    const entry = state ? this._pendingStates.get(state) : undefined;
    if (entry) this._pendingStates.delete(state); // single use
    if (!entry || Date.now() > entry.expiresAt) {
      throw new AppError({ statusCode: 400, code: backupMessagesCodes.DRIVE_STATE_MISMATCH, translationKey: TK });
    }
    return {
      reconnectAccountId: entry.reconnectAccountId,
      accountType: entry.accountType || DRIVE_ACCOUNT_TYPES.DB,
      userId: entry.userId ?? null,
    };
  }

  /**
   * Does the account "hold data of its current type"?
   *  - DB account: has >=1 backup (Backup) linked to it.
   *  - KEY account: has >=1 encryption key (EncryptionKey) linked to it.
   * The account type is locked once it holds data of its type; an empty account
   * may be re-typed.
   * @returns {Promise<boolean>}
   */
  async _accountHoldsTypeData(account) {
    const currentType = account.type || DRIVE_ACCOUNT_TYPES.DB;
    if (currentType === DRIVE_ACCOUNT_TYPES.KEY) {
      const keyCount = await encryptionKeysRepo.countByAccount({ accountId: account.id });
      return keyCount > 0;
    }
    const backupCount = await driveAccountsRepo.countBackups({ accountId: account.id });
    return backupCount > 0;
  }

  /**
   * Resolves the final type of an existing account when connecting/re-adding with
   * a chosen type.
   *  - chosen === current → no change (token update only).
   *  - chosen !== current + holds data of its current type → ACCOUNT_TYPE_LOCKED.
   *  - chosen !== current + empty → re-typed (return the chosen type).
   * @returns {Promise<"KEY"|"DB"|undefined>} the new type if it changed, else undefined.
   */
  async _resolveTypeForExistingAccount(account, chosenType) {
    const currentType = account.type || DRIVE_ACCOUNT_TYPES.DB;
    if (chosenType === currentType) return undefined;
    const holdsData = await this._accountHoldsTypeData(account);
    if (holdsData) {
      throw new AppError({
        statusCode: 409,
        code: backupMessagesCodes.ACCOUNT_TYPE_LOCKED,
        translationKey: TK,
        details: { accountId: account.id, currentType, chosenType },
      });
    }
    // empty → may be re-typed.
    return chosenType;
  }

  async _fetchIdentity(oauth2) {
    try {
      const google = await getGoogle();
      const drive = google.drive({ version: "v3", auth: oauth2 });
      const res = await drive.about.get({ fields: "user(emailAddress,permissionId)" });
      const user = res?.data?.user || {};
      return { email: user.emailAddress || null, googleUserId: user.permissionId || null };
    } catch (err) {
      // Diagnostic: identity fetch is best-effort, but a failure here means email/
      // googleUserId end up null — which breaks reconnect/identity-binding. Log why.
      console.error(
        "[drive-callback] identity fetch failed:",
        "status=", err?.code || err?.response?.status,
        "message=", err?.message,
        "googleError=", err?.response?.data?.error,
      );
      return { email: null, googleUserId: null };
    }
  }

  /**
   * Exchanges code for tokens, fetches identity, and creates/updates a
   * DriveAccount row.
   * @returns {Promise<{ accountId:number, email:string|null, isActive:boolean }>}
   */
  async handleCallback(code, state) {
    // The initiating userId is available for tracing (not required for logic here).
    const { reconnectAccountId, accountType } = this._verifyState(state);

    const oauth2 = await buildOAuthClient();
    let tokens;
    try {
      ({ tokens } = await oauth2.getToken(code));
    } catch (err) {
      // Diagnostic: surface the underlying Google error (redirect_uri mismatch,
      // invalid/expired code, clock skew, etc.) without logging the code/tokens.
      console.error(
        "[drive-callback] getToken failed:",
        "message=", err?.message,
        "googleError=", err?.response?.data?.error,
        "googleErrorDescription=", err?.response?.data?.error_description,
      );
      throw new AppError({ statusCode: 400, code: backupMessagesCodes.DRIVE_AUTH_FAILED, translationKey: TK });
    }
    if (!tokens || !tokens.refresh_token) {
      // Diagnostic: tokens arrived but without a refresh_token. Google only returns
      // one with access_type=offline + prompt=consent on (re)consent — if the app was
      // previously authorized and consent was not re-shown, this is the cause.
      console.error(
        "[drive-callback] missing refresh_token:",
        "hasTokens=", !!tokens,
        "hasAccessToken=", !!tokens?.access_token,
        "scope=", tokens?.scope,
      );
      throw new AppError({ statusCode: 400, code: backupMessagesCodes.DRIVE_AUTH_FAILED, translationKey: TK });
    }

    oauth2.setCredentials(tokens);
    const { email, googleUserId } = await this._fetchIdentity(oauth2);

    const { cipher, iv, tag } = encrypt(JSON.stringify(tokens));
    const tokenData = {
      tokensCipher: cipher,
      tokensIv: iv,
      tokensTag: tag,
      lastConnectedAt: new Date(),
      lastErrorCode: null,
    };

    // Reconnect path: update this exact row while *binding the identity* (we
    // prevent attaching a different Google account). We require a successful
    // identity fetch: if it could not (_fetchIdentity returned null) we reject the
    // reconnect rather than reconnecting silently. If the stored account has a
    // prior identity, the fetched one must match; if it is null (first time) we set
    // it from the fetched one. Reconnect does not change the account type.
    if (reconnectAccountId != null) {
      if (!googleUserId) {
        throw new AppError({
          statusCode: 409,
          code: backupMessagesCodes.DRIVE_RECONNECT_IDENTITY_MISMATCH,
          translationKey: TK,
        });
      }
      const target = await driveAccountsRepo.findById({ id: reconnectAccountId });
      if (!target) {
        throw new AppError({ statusCode: 404, code: backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND, translationKey: TK });
      }
      // The fetched identity must not belong to another account.
      const other = await driveAccountsRepo.findByGoogleUserId({ googleUserId });
      if (other && other.id !== reconnectAccountId) {
        throw new AppError({
          statusCode: 409,
          code: backupMessagesCodes.DRIVE_RECONNECT_IDENTITY_MISMATCH,
          translationKey: TK,
        });
      }
      // If the account has a prior identity it must match the fetched one (we do
      // not reconnect it to a different account).
      if (target.googleUserId && target.googleUserId !== googleUserId) {
        throw new AppError({
          statusCode: 409,
          code: backupMessagesCodes.DRIVE_RECONNECT_IDENTITY_MISMATCH,
          translationKey: TK,
        });
      }
      const updated = await driveAccountsRepo.update({
        id: reconnectAccountId,
        data: { ...tokenData, email: email ?? undefined, googleUserId },
      });
      return { accountId: updated.id, email: updated.email, isActive: updated.isActive };
    }

    // Add path: match by googleUserId (update) or create a new row.
    let existing = null;
    if (googleUserId) {
      existing = await driveAccountsRepo.findByGoogleUserId({ googleUserId });
    }
    if (existing) {
      // Type lock: if the chosen type differs from the existing account type and it
      // holds data of its type → ACCOUNT_TYPE_LOCKED; if empty → re-type to chosen.
      const newType = await this._resolveTypeForExistingAccount(existing, accountType);
      const data = { ...tokenData, email: email ?? undefined, type: newType ?? undefined };
      // If re-typed to KEY it is not a valid upload destination — deactivate it
      // (the upload destination is always DB).
      if (newType === DRIVE_ACCOUNT_TYPES.KEY) data.isActive = false;
      const updated = await driveAccountsRepo.update({ id: existing.id, data });
      return { accountId: updated.id, email: updated.email, isActive: updated.isActive };
    }

    // New account: type from the state (KEY|DB). isActive is enabled only for the
    // first DB account (the active account is the backup upload destination — always DB).
    const type = accountType === DRIVE_ACCOUNT_TYPES.KEY ? DRIVE_ACCOUNT_TYPES.KEY : DRIVE_ACCOUNT_TYPES.DB;
    const all = await driveAccountsRepo.list();
    const isFirstDb =
      type === DRIVE_ACCOUNT_TYPES.DB &&
      !all.some((a) => (a.type || DRIVE_ACCOUNT_TYPES.DB) === DRIVE_ACCOUNT_TYPES.DB);
    const created = await driveAccountsRepo.create({
      data: { ...tokenData, email, googleUserId, type, isActive: isFirstDb },
    });
    return { accountId: created.id, email: created.email, isActive: created.isActive };
  }

  async getClientForAccount(accountId) {
    const account = await driveAccountsRepo.findById({ id: accountId });
    if (!account) {
      throw new AppError({ statusCode: 404, code: backupMessagesCodes.DRIVE_ACCOUNT_NOT_FOUND, translationKey: TK });
    }
    if (!account.tokensCipher) {
      throw new AppError({ statusCode: 400, code: backupMessagesCodes.DRIVE_NOT_CONNECTED, translationKey: TK });
    }
    let tokens;
    try {
      tokens = JSON.parse(
        decrypt({ cipher: account.tokensCipher, iv: account.tokensIv, tag: account.tokensTag }),
      );
    } catch {
      throw new AppError({ statusCode: 400, code: backupMessagesCodes.DRIVE_AUTH_FAILED, translationKey: TK });
    }
    const oauth2 = await buildOAuthClient();
    oauth2.setCredentials(tokens);
    const google = await getGoogle();
    return google.drive({ version: "v3", auth: oauth2 });
  }

  /**
   * Lightweight connection check (about.get) — updates lastConnectedAt/lastErrorCode.
   * Does not throw.
   * @returns {Promise<{ connected: boolean, errorCode?: string }>}
   */
  async checkConnection(accountId) {
    try {
      const drive = await this.getClientForAccount(accountId);
      await drive.about.get({ fields: "user(emailAddress)" });
      await driveAccountsRepo.update({
        id: accountId,
        data: { lastConnectedAt: new Date(), lastErrorCode: null },
      });
      return { connected: true };
    } catch (err) {
      const code = err instanceof AppError ? err.code : mapDriveError(err).code;
      try {
        await driveAccountsRepo.update({ id: accountId, data: { lastErrorCode: code } });
      } catch {
        /* updating the error state is secondary */
      }
      return { connected: false, errorCode: code };
    }
  }

  async ensureFolder(accountId) {
    const account = await driveAccountsRepo.findById({ id: accountId });
    if (account && account.folderId) return account.folderId;

    const drive = await this.getClientForAccount(accountId);
    const folderName = ENV.google.driveFolderName || "Ayah Academy Backups";
    try {
      const res = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`,
        fields: "files(id,name)",
        spaces: "drive",
      });
      let folderId;
      if (res.data.files && res.data.files.length > 0) {
        folderId = res.data.files[0].id;
      } else {
        const created = await drive.files.create({
          requestBody: { name: folderName, mimeType: "application/vnd.google-apps.folder" },
          fields: "id",
        });
        folderId = created.data.id;
      }
      try {
        await driveAccountsRepo.update({ id: accountId, data: { folderId } });
      } catch {
        /* folder cache is secondary */
      }
      return folderId;
    } catch (err) {
      throw mapDriveError(err);
    }
  }

  /** Uploads a local file to the account folder and returns driveFileId. */
  async uploadFile(accountId, localPath, fileName) {
    const drive = await this.getClientForAccount(accountId);
    const folderId = await this.ensureFolder(accountId);
    try {
      const res = await drive.files.create({
        requestBody: { name: fileName, parents: [folderId] },
        media: { mimeType: "application/octet-stream", body: fs.createReadStream(localPath) },
        fields: "id",
      });
      return res.data.id;
    } catch (err) {
      throw mapDriveError(err);
    }
  }

  /** Downloads a file from Drive as a Buffer (for restore when the local file is gone). */
  async downloadFile(accountId, driveFileId) {
    const drive = await this.getClientForAccount(accountId);
    try {
      const res = await drive.files.get(
        { fileId: driveFileId, alt: "media" },
        { responseType: "arraybuffer" },
      );
      return Buffer.from(res.data);
    } catch (err) {
      throw mapDriveError(err);
    }
  }

  /** Deletes a file from Drive (retention). Does not throw if the file is already gone. */
  async deleteFile(accountId, driveFileId) {
    if (!driveFileId) return;
    const drive = await this.getClientForAccount(accountId);
    try {
      await drive.files.delete({ fileId: driveFileId });
    } catch (err) {
      const status = err?.code || err?.response?.status;
      if (status === 404) return;
      throw mapDriveError(err);
    }
  }

  /**
   * Writes a small text file (e.g. a .pem key file) to the account folder and
   * returns driveFileId. Used to store encryption-key material on a KEY account.
   */
  async writeTextFile(accountId, fileName, text) {
    const drive = await this.getClientForAccount(accountId);
    const folderId = await this.ensureFolder(accountId);
    try {
      const res = await drive.files.create({
        requestBody: { name: fileName, parents: [folderId] },
        media: { mimeType: "text/plain", body: Readable.from([Buffer.from(text, "utf8")]) },
        fields: "id",
      });
      return res.data.id;
    } catch (err) {
      throw mapDriveError(err);
    }
  }

  /** Reads a file's text from Drive via driveFileId (e.g. fetching key material). */
  async readTextFile(accountId, driveFileId) {
    const drive = await this.getClientForAccount(accountId);
    try {
      const res = await drive.files.get(
        { fileId: driveFileId, alt: "media" },
        { responseType: "arraybuffer" },
      );
      return Buffer.from(res.data).toString("utf8");
    } catch (err) {
      throw mapDriveError(err);
    }
  }

  /** Disconnects the account (clears tokens + connection state, keeps the row). */
  async disconnect(accountId) {
    await driveAccountsRepo.update({
      id: accountId,
      data: {
        tokensCipher: null,
        tokensIv: null,
        tokensTag: null,
        isActive: false,
        lastConnectedAt: null,
        lastErrorCode: null,
      },
    });
  }
}

function mapDriveError(err) {
  const status = err?.code || err?.response?.status;
  if (status === 401 || status === 403) {
    return new AppError({ statusCode: 400, code: backupMessagesCodes.DRIVE_AUTH_FAILED, translationKey: TK });
  }
  if (status === 404) {
    return new AppError({ statusCode: 404, code: backupMessagesCodes.FILE_MISSING, translationKey: TK });
  }
  return new AppError({
    statusCode: 502,
    code: backupMessagesCodes.DRIVE_UPLOAD_FAILED,
    translationKey: TK,
    details: { status },
  });
}

export const driveProvider = new DriveProvider();
export { DriveProvider, DRIVE_SCOPE, OAUTH_SCOPES };
