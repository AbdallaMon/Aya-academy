import { Router } from "express";
import { SESSION_PERMISSIONS } from "@aya/shared";
import { sessionController } from "./session.controller.js";
import { SessionValidation } from "./session.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const sessionRoutes = Router();

sessionRoutes.use(authMiddleware.requireAuth);

sessionRoutes.get(
  "/",
  authMiddleware.requirePermissions([SESSION_PERMISSIONS.LIST]),
  asyncHandler(sessionController.list),
);

sessionRoutes.get(
  "/:id",
  authMiddleware.requirePermissions([SESSION_PERMISSIONS.VIEW]),
  asyncHandler(sessionController.getOne),
);

sessionRoutes.post(
  "/",
  authMiddleware.requirePermissions([SESSION_PERMISSIONS.CREATE]),
  validate(SessionValidation.createSessionSchema),
  asyncHandler(sessionController.create),
);

sessionRoutes.put(
  "/:id",
  authMiddleware.requirePermissions([SESSION_PERMISSIONS.EDIT]),
  validate(SessionValidation.updateSessionSchema),
  asyncHandler(sessionController.update),
);

sessionRoutes.delete(
  "/:id",
  authMiddleware.requirePermissions([SESSION_PERMISSIONS.DELETE]),
  asyncHandler(sessionController.remove),
);

sessionRoutes.put(
  "/:id/plan",
  authMiddleware.requirePermissions([SESSION_PERMISSIONS.EDIT]),
  validate(SessionValidation.setPlanSchema),
  asyncHandler(sessionController.setPlan),
);

export default sessionRoutes;
