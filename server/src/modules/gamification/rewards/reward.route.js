import { Router } from "express";
import { PERMISSIONS } from "@aya/shared";
import { rewardController } from "./reward.controller.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const rewardRoutes = Router();

rewardRoutes.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.REWARD.LIST]),
  asyncHandler(rewardController.list),
);

rewardRoutes.get(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.REWARD.VIEW]),
  asyncHandler(rewardController.getOne),
);

rewardRoutes.post(
  "/:id/claim",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.REWARD.CLAIM]),
  asyncHandler(rewardController.claim),
);

export default rewardRoutes;
