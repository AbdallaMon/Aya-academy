import { Router } from "express";
import { PAYMENT_TEMPLATE_PERMISSIONS } from "@ayah/shared";
import { paymentTemplateController } from "./paymentTemplate.controller.js";
import { PaymentTemplateValidation } from "./paymentTemplate.validation.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const paymentTemplateRoutes = Router();

paymentTemplateRoutes.use(authMiddleware.requireAuth);

paymentTemplateRoutes.get(
  "/",
  authMiddleware.requirePermissions([PAYMENT_TEMPLATE_PERMISSIONS.VIEW]),
  asyncHandler(paymentTemplateController.get),
);

paymentTemplateRoutes.put(
  "/",
  authMiddleware.requirePermissions([PAYMENT_TEMPLATE_PERMISSIONS.MANAGE]),
  validate(PaymentTemplateValidation.updateSchema),
  asyncHandler(paymentTemplateController.update),
);

export default paymentTemplateRoutes;
