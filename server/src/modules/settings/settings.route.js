import { Router } from "express";
import { SETTINGS_PERMISSIONS } from "@aya/shared";
import { settingsController } from "./settings.controller.js";
import { SettingsValidation } from "./settings.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const settingsRoutes = Router();

settingsRoutes.use(authMiddleware.requireAuth);

// Readable by any authenticated user: the currency + hourly rate drive price
// DISPLAY across the whole app (plans, subscriptions, invoices). Not sensitive
// (pricing is public). Only mutation is admin-gated.
settingsRoutes.get("/", asyncHandler(settingsController.get));

settingsRoutes.put(
  "/",
  authMiddleware.requirePermissions([SETTINGS_PERMISSIONS.MANAGE]),
  validate(SettingsValidation.updateSchema),
  asyncHandler(settingsController.update),
);

export default settingsRoutes;
