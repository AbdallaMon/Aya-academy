import { Router } from "express";
import { POINT_PERMISSIONS } from "@aya/shared";
import { pointController } from "./point.controller.js";
import { PointValidation } from "./point.validation.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const pointRoutes = Router();

pointRoutes.use(authMiddleware.requireAuth);

// Leaderboard is viewable by anyone holding VIEW_LEADERBOARD (admin/parent/student).
pointRoutes.get(
  "/leaderboard",
  authMiddleware.requirePermissions([POINT_PERMISSIONS.VIEW_LEADERBOARD]),
  asyncHandler(pointController.leaderboard),
);

// A student's ledger. Object scope (self / linked child / admin) enforced in the usecase.
pointRoutes.get(
  "/",
  authMiddleware.requirePermissions([POINT_PERMISSIONS.LIST]),
  asyncHandler(pointController.list),
);

// Admin manually awards / adjusts points.
pointRoutes.post(
  "/",
  authMiddleware.requirePermissions([POINT_PERMISSIONS.AWARD]),
  validate(PointValidation.awardPointsSchema),
  asyncHandler(pointController.award),
);

export default pointRoutes;
