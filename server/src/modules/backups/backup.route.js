// ===========================================================================
// backup.route — all routes guarded by backup.manage (admin-only per profiles).
// Static/specific routes are declared before dynamic ones. State actions go via
// POST /actions/<kebab>.
//
// NOTE: GET /drive/callback is PUBLIC (no auth) and mounted in routes.js BEFORE
// authentication — see backup.public.route.js. Auth is mounted once here.
// ===========================================================================

import { Router } from "express";
import { PERMISSIONS } from "@aya/shared";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { backupsController } from "./backup.controller.js";
import { BackupsValidation } from "./backup.validation.js";
import { uploadRestoreFile } from "../../infra/upload/backups.upload.js";

const router = Router();
const c = backupsController;
const guard = authMiddleware.requirePermissions([PERMISSIONS.BACKUP.MANAGE]);

router.use(authMiddleware.requireAuth);

// Backups list (paginated + filters).
router.get("/", guard, validate(BackupsValidation.list, "query"), asyncHandler(c.list));

// System status (last successful backup + accounts summary + scheduled time).
router.get("/status", guard, asyncHandler(c.status));

// Backup/restore actions — POST /actions/<kebab>.
router.post(
  "/actions/run-now",
  guard,
  validate(BackupsValidation.runNow, "body"),
  asyncHandler(c.runNow),
);
router.post(
  "/actions/restore",
  guard,
  validate(BackupsValidation.restore),
  asyncHandler(c.restore),
);

// External-file (.enc) restore: check (multipart) then commit (JSON).
router.post(
  "/actions/restore-external/check",
  guard,
  uploadRestoreFile,
  validate(BackupsValidation.restoreExternalCheck, "body"),
  asyncHandler(c.restoreExternalCheck),
);
router.post(
  "/actions/restore-external/commit",
  guard,
  validate(BackupsValidation.restoreExternalCommit),
  asyncHandler(c.restoreExternalCommit),
);

// Google Drive — static account routes before /:id.
router.get(
  "/drive/accounts",
  guard,
  validate(BackupsValidation.driveAccountsQuery, "query"),
  asyncHandler(c.driveAccounts),
);
router.get(
  "/drive/connect",
  guard,
  validate(BackupsValidation.driveConnect, "query"),
  asyncHandler(c.driveConnect),
);

// Specific-account actions.
router.post(
  "/drive/accounts/:id/actions/set-active",
  guard,
  validate(BackupsValidation.idParam, "params"),
  asyncHandler(c.setActiveAccount),
);
router.post(
  "/drive/accounts/:id/actions/check",
  guard,
  validate(BackupsValidation.idParam, "params"),
  asyncHandler(c.checkAccount),
);
router.post(
  "/drive/accounts/:id/actions/disconnect",
  guard,
  validate(BackupsValidation.idParam, "params"),
  asyncHandler(c.disconnectAccount),
);
router.delete(
  "/drive/accounts/:id",
  guard,
  validate(BackupsValidation.idParam, "params"),
  asyncHandler(c.removeAccount),
);

// Delete a specific backup — dynamic on the root, after all static/specific routes.
router.delete(
  "/:id",
  guard,
  validate(BackupsValidation.idParam, "params"),
  asyncHandler(c.remove),
);

export default router;
