import { Router } from "express";
import { NOTIFICATION_PERMISSIONS } from "@aya/shared";
import { notificationController } from "./notification.controller.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const notificationRoutes = Router();

notificationRoutes.use(authMiddleware.requireAuth);

notificationRoutes.get(
  "/",
  authMiddleware.requirePermissions([NOTIFICATION_PERMISSIONS.LIST]),
  asyncHandler(notificationController.list),
);

// declared before "/:id" routes so the literal path always matches first
notificationRoutes.get(
  "/unread-count",
  authMiddleware.requirePermissions([NOTIFICATION_PERMISSIONS.LIST]),
  asyncHandler(notificationController.unreadCount),
);

notificationRoutes.patch(
  "/read-all",
  authMiddleware.requirePermissions([NOTIFICATION_PERMISSIONS.READ]),
  asyncHandler(notificationController.markAllRead),
);

notificationRoutes.patch(
  "/:id/read",
  authMiddleware.requirePermissions([NOTIFICATION_PERMISSIONS.READ]),
  asyncHandler(notificationController.markRead),
);

export default notificationRoutes;
