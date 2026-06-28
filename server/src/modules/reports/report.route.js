import { Router } from "express";
import { REPORT_PERMISSIONS } from "@aya/shared";
import { reportController } from "./report.controller.js";
import { ReportValidation } from "./report.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const reportRoutes = Router();

reportRoutes.use(authMiddleware.requireAuth);

reportRoutes.get(
  "/",
  authMiddleware.requirePermissions([REPORT_PERMISSIONS.LIST]),
  asyncHandler(reportController.list),
);

reportRoutes.get(
  "/:id",
  authMiddleware.requirePermissions([REPORT_PERMISSIONS.VIEW]),
  asyncHandler(reportController.getOne),
);

reportRoutes.post(
  "/",
  authMiddleware.requirePermissions([REPORT_PERMISSIONS.CREATE]),
  validate(ReportValidation.createReportSchema),
  asyncHandler(reportController.create),
);

reportRoutes.put(
  "/:id",
  authMiddleware.requirePermissions([REPORT_PERMISSIONS.EDIT]),
  validate(ReportValidation.updateReportSchema),
  asyncHandler(reportController.update),
);

reportRoutes.delete(
  "/:id",
  authMiddleware.requirePermissions([REPORT_PERMISSIONS.DELETE]),
  asyncHandler(reportController.remove),
);

export default reportRoutes;
