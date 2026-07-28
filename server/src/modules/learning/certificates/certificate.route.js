import { Router } from "express";
import { PERMISSIONS } from "@ayah/shared";
import { certificateController } from "./certificate.controller.js";
import { CertificateValidation } from "./certificate.validation.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const certificateRoutes = Router();

certificateRoutes.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.CERTIFICATE.LIST]),
  asyncHandler(certificateController.list),
);

certificateRoutes.post(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.CERTIFICATE.CREATE]),
  validate(CertificateValidation.createManualSchema),
  asyncHandler(certificateController.create),
);

certificateRoutes.get(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.CERTIFICATE.VIEW]),
  asyncHandler(certificateController.getOne),
);

export default certificateRoutes;
