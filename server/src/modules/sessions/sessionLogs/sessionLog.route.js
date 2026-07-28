import { Router } from "express";
import { SESSION_LOG_PERMISSIONS } from "@ayah/shared";
import { sessionLogController } from "./sessionLog.controller.js";
import { SessionLogValidation } from "./sessionLog.validation.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const sessionLogRoutes = Router();

sessionLogRoutes.use(authMiddleware.requireAuth);

sessionLogRoutes.get(
  "/",
  authMiddleware.requirePermissions([SESSION_LOG_PERMISSIONS.LIST]),
  asyncHandler(sessionLogController.list),
);

sessionLogRoutes.get(
  "/:id",
  authMiddleware.requirePermissions([SESSION_LOG_PERMISSIONS.VIEW]),
  asyncHandler(sessionLogController.getOne),
);

sessionLogRoutes.post(
  "/",
  authMiddleware.requirePermissions([SESSION_LOG_PERMISSIONS.CREATE]),
  validate(SessionLogValidation.createSessionLogSchema),
  asyncHandler(sessionLogController.create),
);

sessionLogRoutes.put(
  "/:id",
  authMiddleware.requirePermissions([SESSION_LOG_PERMISSIONS.EDIT]),
  validate(SessionLogValidation.updateSessionLogSchema),
  asyncHandler(sessionLogController.update),
);

sessionLogRoutes.delete(
  "/:id",
  authMiddleware.requirePermissions([SESSION_LOG_PERMISSIONS.DELETE]),
  asyncHandler(sessionLogController.remove),
);

export default sessionLogRoutes;
