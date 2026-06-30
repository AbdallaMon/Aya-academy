// backups.controller — thin: reads validated input, calls the usecase, responds
// via helpers. No business logic.

import { ok, created } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { backupMessagesCodes, generalMessagesCodes, messagesNames } from "@aya/shared";
import { ENV } from "../../config/env.js";
import { backupsUsecase } from "./backups.usecase.js";

const TK = messagesNames.backupMessages;

class BackupsController {
  async list(req, res) {
    const data = await backupsUsecase.list({ query: req.query });
    return ok(res, data, generalMessagesCodes.OK, TK);
  }

  async runNow(req, res) {
    const data = await backupsUsecase.runNow({ input: req.body, authUser: req.auth });
    return created(res, data, backupMessagesCodes.CREATED, TK);
  }

  async restore(req, res) {
    const data = await backupsUsecase.restore({ input: req.body, authUser: req.auth });
    return ok(res, data, backupMessagesCodes.RESTORE_DONE, TK);
  }

  async status(req, res) {
    const data = await backupsUsecase.status();
    return ok(res, data, generalMessagesCodes.OK, TK);
  }

  async remove(req, res) {
    const data = await backupsUsecase.remove({ id: idParam(req.params.id), authUser: req.auth });
    return ok(res, data, backupMessagesCodes.DELETED, TK);
  }

  // ----- OAuth ------------------------------------------------------------

  async driveConnect(req, res) {
    const reconnectId = req.query.reconnectId ? Number(req.query.reconnectId) : undefined;
    const data = await backupsUsecase.getDriveAuthUrl({
      reconnectId,
      type: req.query.type,
      userId: req.auth?.id,
    });
    return ok(res, data, generalMessagesCodes.OK, TK);
  }

  /**
   * Browser landing from Google — we respond with a 302 redirect to the frontend
   * page (ENV.appUrl). We catch the error here specifically because the redirect is
   * the response contract for the browser (the code stays language-neutral in the
   * URL).
   */
  async driveCallback(req, res) {
    // The backups page path on the frontend (Next.js): /dashboard/backups — the
    // accounts tab reads ?drive=connected|error and shows a toast, then cleans the URL.
    const base = `${ENV.appUrl}/dashboard/backups`;
    try {
      await backupsUsecase.handleDriveCallback({ input: req.query });
      return res.redirect(302, `${base}?drive=connected`);
    } catch (err) {
      // Diagnostic: the browser only sees the language-neutral `reason` code, so the
      // true cause is surfaced here in the server log (never the tokens). Remove once
      // the drive-connect failure is understood.
      console.error(
        "[drive-callback] failed:",
        "code=", err?.code,
        "statusCode=", err?.statusCode,
        "message=", err?.message,
        "details=", err?.details,
      );
      console.error("[drive-callback] stack:", err?.stack);
      const reason = encodeURIComponent(err?.code || backupMessagesCodes.DRIVE_AUTH_FAILED);
      return res.redirect(302, `${base}?drive=error&reason=${reason}`);
    }
  }

  // ----- Drive accounts ---------------------------------------------------

  async driveAccounts(req, res) {
    const data = await backupsUsecase.driveAccounts({ query: req.query });
    return ok(res, data, generalMessagesCodes.OK, TK);
  }

  async setActiveAccount(req, res) {
    const data = await backupsUsecase.setActiveAccount({ id: idParam(req.params.id), authUser: req.auth });
    return ok(res, data, backupMessagesCodes.DRIVE_ACCOUNT_ACTIVATED, TK);
  }

  async checkAccount(req, res) {
    const data = await backupsUsecase.checkAccount({ id: idParam(req.params.id) });
    return ok(res, data, backupMessagesCodes.DRIVE_ACCOUNT_CHECKED, TK);
  }

  async disconnectAccount(req, res) {
    const data = await backupsUsecase.disconnectAccount({ id: idParam(req.params.id), authUser: req.auth });
    return ok(res, data, backupMessagesCodes.DRIVE_ACCOUNT_DISCONNECTED, TK);
  }

  async removeAccount(req, res) {
    const data = await backupsUsecase.removeAccount({ id: idParam(req.params.id), authUser: req.auth });
    return ok(res, data, backupMessagesCodes.DRIVE_ACCOUNT_REMOVED, TK);
  }

  // ----- External restore -------------------------------------------------

  async restoreExternalCheck(req, res) {
    const data = await backupsUsecase.restoreExternalCheck({
      file: req.file,
      input: req.body,
      authUser: req.auth,
    });
    return ok(res, data, backupMessagesCodes.RESTORE_EXTERNAL_CHECKED, TK);
  }

  async restoreExternalCommit(req, res) {
    const data = await backupsUsecase.restoreExternalCommit({ input: req.body, authUser: req.auth });
    return ok(res, data, backupMessagesCodes.RESTORE_DONE, TK);
  }
}

export const backupsController = new BackupsController();
export { BackupsController };
