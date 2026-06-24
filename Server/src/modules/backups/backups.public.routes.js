// ===========================================================================
// backups.public.routes — the public OAuth callback route (no auth).
//
// Why public? Google redirects the browser to this route, which is a cross-site
// navigation (origin accounts.google.com). Our session cookies are SameSite, so
// they are NOT sent with this request → it would fail with UNAUTHENTICATED even
// when logged in.
//
// Security: it never relies on the session — it verifies the server-stored `state`
// in the drive provider (CSRF + single-use + TTL). It is mounted in routes.js
// BEFORE authentication. The rest of /backups stays protected.
// ===========================================================================

import { Router } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { backupsController } from "./backups.controller.js";
import { BackupsValidation } from "./backups.validation.js";

const router = Router();
const c = backupsController;

router.get(
  "/drive/callback",
  validate(BackupsValidation.driveCallback, "query"),
  asyncHandler(c.driveCallback),
);

export default router;
