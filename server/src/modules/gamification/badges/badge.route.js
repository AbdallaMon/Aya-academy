import { Router } from "express";
import { BADGE_PERMISSIONS } from "@ayah/shared";
import { badgeController } from "./badge.controller.js";
import { BadgeValidation } from "./badge.validation.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const badgeRoutes = Router();

badgeRoutes.use(authMiddleware.requireAuth);

badgeRoutes.get(
  "/",
  authMiddleware.requirePermissions([BADGE_PERMISSIONS.LIST]),
  asyncHandler(badgeController.list),
);

badgeRoutes.post(
  "/",
  authMiddleware.requirePermissions([BADGE_PERMISSIONS.CREATE]),
  validate(BadgeValidation.createBadgeSchema),
  asyncHandler(badgeController.create),
);

// A student's awarded badges. Object scope enforced in the usecase.
badgeRoutes.get(
  "/student/:studentId",
  authMiddleware.requirePermissions([BADGE_PERMISSIONS.VIEW]),
  asyncHandler(badgeController.studentBadges),
);

badgeRoutes.get(
  "/:id",
  authMiddleware.requirePermissions([BADGE_PERMISSIONS.VIEW]),
  asyncHandler(badgeController.getOne),
);

badgeRoutes.patch(
  "/:id",
  authMiddleware.requirePermissions([BADGE_PERMISSIONS.EDIT]),
  validate(BadgeValidation.updateBadgeSchema),
  asyncHandler(badgeController.update),
);

badgeRoutes.delete(
  "/:id",
  authMiddleware.requirePermissions([BADGE_PERMISSIONS.DELETE]),
  asyncHandler(badgeController.remove),
);

// Award / revoke a badge to/from a student.
badgeRoutes.post(
  "/:id/award",
  authMiddleware.requirePermissions([BADGE_PERMISSIONS.AWARD]),
  validate(BadgeValidation.awardBadgeSchema),
  asyncHandler(badgeController.award),
);

badgeRoutes.post(
  "/:id/revoke",
  authMiddleware.requirePermissions([BADGE_PERMISSIONS.REVOKE]),
  validate(BadgeValidation.revokeBadgeSchema),
  asyncHandler(badgeController.revoke),
);

export default badgeRoutes;
