import { Router } from "express";
import { ok } from "./shared/http/response.js";
import authRoutes from "./modules/auth/auth.route.js";
import userRoutes from "./modules/users/user.route.js";
import notificationRoutes from "./modules/notifications/notification.route.js";
import financeRoutes from "./modules/finance/finance.route.js";
import gamificationRoutes from "./modules/gamification/gamification.route.js";
import learningRoutes from "./modules/learning/learning.route.js";
import sessionsRoutes from "./modules/sessions/sessions.route.js";
import dashboardRoutes from "./modules/dashboard/dashboard.route.js";
import backupRoutes from "./modules/backups/backups.route.js";
import backupPublicRoutes from "./modules/backups/backups.public.routes.js";
import encryptionKeyRoutes from "./modules/encryptionKeys/encryptionKeys.route.js";
import attachmentRoutes from "./modules/attachments/attachment.route.js";
import settingsRoutes from "./modules/settings/settings.route.js";

const routes = Router();

routes.get("/health", (_req, res) => {
  ok(res, { status: "up", timestamp: new Date().toISOString() });
});

routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/notifications", notificationRoutes);
routes.use("/settings", settingsRoutes);

// Grouped module aggregators. Each mounts its children at their original
// URL prefixes, so every final URL (e.g. /subscriptions, /payment-templates,
// /session-logs) is byte-for-byte identical to before the reorganization.
routes.use("/", financeRoutes);
routes.use("/", gamificationRoutes);
routes.use("/", learningRoutes);
routes.use("/", sessionsRoutes);

routes.use("/dashboard", dashboardRoutes);

// Google Drive OAuth callback (PUBLIC, no auth — Google redirects the browser here).
// Mounted BEFORE the protected /backups router so GET /backups/drive/callback
// resolves without authentication. The rest of /backups stays guarded.
routes.use("/backups", backupPublicRoutes);
routes.use("/backups", backupRoutes);
routes.use("/encryption-keys", encryptionKeyRoutes);
routes.use("/attachments", attachmentRoutes);

export default routes;
