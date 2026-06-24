// ===========================================================================
// encryptionKeys.route — backup-encryption keys (material stored on Drive).
// Every route is guarded by backup.manage (admin-only per role profiles). Auth is
// mounted once at the router. Static/specific routes come before the dynamic ones.
// Changing "primary" is done via POST /:id/actions/set-primary (no generic PATCH
// on a status field).
// ===========================================================================

import { Router } from "express";
import { PERMISSIONS } from "@aya/shared";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { encryptionKeysController } from "./encryptionKeys.controller.js";
import { EncryptionKeysValidation } from "./encryptionKeys.validation.js";

const router = Router();
const c = encryptionKeysController;
const guard = authMiddleware.requirePermissions([PERMISSIONS.BACKUP.MANAGE]);

router.use(authMiddleware.requireAuth);

// Generate a key (not stored) — static, before any dynamic route.
router.post("/generate", guard, asyncHandler(c.generate));

// List keys + their accounts' connection state.
router.get("/", guard, asyncHandler(c.list));

// Save a key on a KEY account (writes the file to Drive + stores the fingerprint).
router.post("/", guard, validate(EncryptionKeysValidation.save), asyncHandler(c.save));

// Set a key primary — a state action.
router.post(
  "/:id/actions/set-primary",
  guard,
  validate(EncryptionKeysValidation.idParam, "params"),
  asyncHandler(c.setPrimary),
);

// Delete a key — dynamic on the root, after all static/specific routes.
router.delete(
  "/:id",
  guard,
  validate(EncryptionKeysValidation.idParam, "params"),
  asyncHandler(c.remove),
);

export default router;
