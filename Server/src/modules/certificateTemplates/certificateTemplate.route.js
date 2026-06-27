import { Router } from "express";
import { CERTIFICATE_PERMISSIONS } from "@aya/shared";
import { certificateTemplateController } from "./certificateTemplate.controller.js";
import { CertificateTemplateValidation } from "./certificateTemplate.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const certificateTemplateRoutes = Router();

// PUBLIC — must be declared BEFORE the blanket requireAuth below. The anonymous
// free-game certificate reads the active GAME template so it matches the
// admin-designed look (render fields only; no internal flags).
certificateTemplateRoutes.get(
  "/public/active-game",
  asyncHandler(certificateTemplateController.getActiveGamePublic),
);

certificateTemplateRoutes.use(authMiddleware.requireAuth);

certificateTemplateRoutes.get(
  "/",
  authMiddleware.requireAnyPermission([
    CERTIFICATE_PERMISSIONS.LIST,
    CERTIFICATE_PERMISSIONS.MANAGE_TEMPLATES,
  ]),
  asyncHandler(certificateTemplateController.list),
);

certificateTemplateRoutes.post(
  "/",
  authMiddleware.requirePermissions([CERTIFICATE_PERMISSIONS.MANAGE_TEMPLATES]),
  validate(CertificateTemplateValidation.createSchema),
  asyncHandler(certificateTemplateController.create),
);

certificateTemplateRoutes.get(
  "/:id",
  authMiddleware.requireAnyPermission([
    CERTIFICATE_PERMISSIONS.VIEW,
    CERTIFICATE_PERMISSIONS.MANAGE_TEMPLATES,
  ]),
  asyncHandler(certificateTemplateController.getOne),
);

certificateTemplateRoutes.patch(
  "/:id",
  authMiddleware.requirePermissions([CERTIFICATE_PERMISSIONS.MANAGE_TEMPLATES]),
  validate(CertificateTemplateValidation.updateSchema),
  asyncHandler(certificateTemplateController.update),
);

certificateTemplateRoutes.delete(
  "/:id",
  authMiddleware.requirePermissions([CERTIFICATE_PERMISSIONS.MANAGE_TEMPLATES]),
  asyncHandler(certificateTemplateController.remove),
);

export default certificateTemplateRoutes;
