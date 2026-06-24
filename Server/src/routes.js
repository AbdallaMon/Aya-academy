import { Router } from "express";
import { ok } from "./shared/http/response.js";
import authRoutes from "./modules/auth/auth.route.js";
import userRoutes from "./modules/users/user.route.js";
import planRoutes from "./modules/plans/plan.route.js";
import sessionRoutes from "./modules/sessions/session.route.js";
import notificationRoutes from "./modules/notifications/notification.route.js";
import couponRoutes from "./modules/coupons/coupon.route.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.route.js";
import invoiceRoutes from "./modules/invoices/invoice.route.js";
import paymentTemplateRoutes from "./modules/paymentTemplates/paymentTemplate.route.js";
import reportRoutes from "./modules/reports/report.route.js";
import certificateRoutes from "./modules/certificates/certificate.route.js";
import rewardRoutes from "./modules/rewards/reward.route.js";
import badgeRoutes from "./modules/badges/badge.route.js";
import pointRoutes from "./modules/points/point.route.js";
import gameRoutes from "./modules/games/game.route.js";
import quizRoutes from "./modules/quizzes/quiz.route.js";
import dashboardRoutes from "./modules/dashboard/dashboard.route.js";
import backupRoutes from "./modules/backups/backups.route.js";
import backupPublicRoutes from "./modules/backups/backups.public.routes.js";
import encryptionKeyRoutes from "./modules/encryptionKeys/encryptionKeys.route.js";
import attachmentRoutes from "./modules/attachments/attachment.route.js";
import certificateTemplateRoutes from "./modules/certificateTemplates/certificateTemplate.route.js";
import quranRoutes from "./modules/quran/quran.route.js";

const routes = Router();

routes.get("/health", (_req, res) => {
  ok(res, { status: "up", timestamp: new Date().toISOString() });
});

routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/plans", planRoutes);
routes.use("/sessions", sessionRoutes);
routes.use("/notifications", notificationRoutes);
routes.use("/coupons", couponRoutes);
routes.use("/subscriptions", subscriptionRoutes);
routes.use("/invoices", invoiceRoutes);
routes.use("/payment-templates", paymentTemplateRoutes);
routes.use("/reports", reportRoutes);
routes.use("/certificates", certificateRoutes);
routes.use("/rewards", rewardRoutes);
routes.use("/badges", badgeRoutes);
routes.use("/points", pointRoutes);
routes.use("/games", gameRoutes);
routes.use("/quizzes", quizRoutes);
routes.use("/dashboard", dashboardRoutes);

// Google Drive OAuth callback (PUBLIC, no auth — Google redirects the browser here).
// Mounted BEFORE the protected /backups router so GET /backups/drive/callback
// resolves without authentication. The rest of /backups stays guarded.
routes.use("/backups", backupPublicRoutes);
routes.use("/backups", backupRoutes);
routes.use("/encryption-keys", encryptionKeyRoutes);
routes.use("/attachments", attachmentRoutes);
routes.use("/certificate-templates", certificateTemplateRoutes);
routes.use("/quran", quranRoutes);

export default routes;
