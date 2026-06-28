import { Router } from "express";
import { PERMISSIONS } from "@aya/shared";
import { dashboardController } from "./dashboard.controller.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware.requireAuth);

dashboardRoutes.get(
  "/admin",
  authMiddleware.requirePermissions([PERMISSIONS.DASHBOARD.VIEW_ADMIN]),
  asyncHandler(dashboardController.admin),
);

dashboardRoutes.get(
  "/leaderboard",
  authMiddleware.requireAnyPermission([
    PERMISSIONS.DASHBOARD.VIEW_ADMIN,
    PERMISSIONS.DASHBOARD.VIEW_PARENT,
    PERMISSIONS.DASHBOARD.VIEW_STUDENT,
  ]),
  asyncHandler(dashboardController.leaderboard),
);

dashboardRoutes.get(
  "/parent",
  authMiddleware.requirePermissions([PERMISSIONS.DASHBOARD.VIEW_PARENT]),
  asyncHandler(dashboardController.parent),
);

dashboardRoutes.get(
  "/student",
  authMiddleware.requirePermissions([PERMISSIONS.DASHBOARD.VIEW_STUDENT]),
  asyncHandler(dashboardController.student),
);

export default dashboardRoutes;
