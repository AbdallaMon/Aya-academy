import { Router } from "express";
import { PERMISSIONS } from "@aya/shared";
import { gameController } from "./game.controller.js";
import { GameValidation } from "./game.validation.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { freeGameRateLimiter } from "../../../shared/middlewares/rate-limit.middleware.js";

const gameRoutes = Router();

// PUBLIC — must be declared before the authenticated "/:id" routes.
gameRoutes.get("/public", asyncHandler(gameController.listPublic));
// "/public/free" MUST precede "/public/:slug" (else slug captures "free").
// Rate-limited per IP so the anonymous trial can't be hammered.
gameRoutes.get(
  "/public/free",
  freeGameRateLimiter,
  asyncHandler(gameController.getPublicFree),
);
gameRoutes.get("/public/:slug", asyncHandler(gameController.getPublicBySlug));

gameRoutes.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.LIST]),
  asyncHandler(gameController.list),
);

// Authenticated lookup by slug (dashboard player) — BEFORE "/:id".
gameRoutes.get(
  "/by-slug/:slug",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.VIEW]),
  asyncHandler(gameController.getBySlug),
);

// The signed-in student's own assignments (for badging "My Games") — BEFORE "/:id".
gameRoutes.get(
  "/my/assignments",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.LIST]),
  asyncHandler(gameController.myAssignments),
);

// Admin: a specific student's assignments (student-detail games tab) — BEFORE "/:id".
gameRoutes.get(
  "/student/:studentId/assignments",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.ASSIGN]),
  asyncHandler(gameController.studentAssignments),
);

// The single free game (card data) for the student's dashboard — BEFORE "/:id".
gameRoutes.get(
  "/my/free",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.LIST]),
  asyncHandler(gameController.myFreeGame),
);

gameRoutes.get(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.VIEW]),
  asyncHandler(gameController.getOne),
);

// Admin: choose THIS game as the single public free-trial game.
gameRoutes.post(
  "/:id/free",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.MANAGE]),
  asyncHandler(gameController.setFree),
);

// Admin: link (or unlink, badgeId=null) the badge auto-awarded on completion.
gameRoutes.post(
  "/:id/badge",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.MANAGE]),
  validate(GameValidation.setBadgeSchema),
  asyncHandler(gameController.setBadge),
);

gameRoutes.post(
  "/:id/assign",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.ASSIGN]),
  validate(GameValidation.assignSchema),
  asyncHandler(gameController.assign),
);

// List students assigned to a game + unassign one (admin-only by permission).
gameRoutes.get(
  "/:id/assignments",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.ASSIGN]),
  asyncHandler(gameController.listAssignments),
);

gameRoutes.delete(
  "/:id/assignments/:studentId",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.ASSIGN]),
  asyncHandler(gameController.unassign),
);

gameRoutes.post(
  "/:id/attempt",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.ATTEMPT]),
  validate(GameValidation.attemptSchema),
  asyncHandler(gameController.attempt),
);

gameRoutes.get(
  "/:id/attempts",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.GAME.VIEW]),
  asyncHandler(gameController.listAttempts),
);

export default gameRoutes;
