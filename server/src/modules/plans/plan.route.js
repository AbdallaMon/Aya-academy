import { Router } from "express";
import { PERMISSIONS } from "@aya/shared";
import { planController } from "./plan.controller.js";
import { PlanValidation } from "./plan.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const planRoutes = Router();

// PUBLIC — must be declared before "/:id".
planRoutes.get("/public", asyncHandler(planController.listPublic));

// PUBLIC — price quote for the registration wizard (coupon verify).
planRoutes.post(
  "/quote",
  validate(PlanValidation.quoteSchema),
  asyncHandler(planController.quote),
);

planRoutes.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.PLAN.LIST]),
  asyncHandler(planController.list),
);

planRoutes.post(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.PLAN.CREATE]),
  validate(PlanValidation.createPlanSchema),
  asyncHandler(planController.create),
);

planRoutes.get(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.PLAN.VIEW]),
  asyncHandler(planController.getOne),
);

planRoutes.put(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.PLAN.EDIT]),
  validate(PlanValidation.updatePlanSchema),
  asyncHandler(planController.update),
);

planRoutes.delete(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.PLAN.DELETE]),
  asyncHandler(planController.remove),
);

export default planRoutes;
