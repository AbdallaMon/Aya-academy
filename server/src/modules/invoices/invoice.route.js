import { Router } from "express";
import { INVOICE_PERMISSIONS } from "@aya/shared";
import { invoiceController } from "./invoice.controller.js";
import { InvoiceValidation } from "./invoice.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const invoiceRoutes = Router();

invoiceRoutes.use(authMiddleware.requireAuth);

invoiceRoutes.get(
  "/",
  authMiddleware.requirePermissions([INVOICE_PERMISSIONS.LIST]),
  asyncHandler(invoiceController.list),
);

// Invoice for a given subscription (scoped). Returns null when none exists.
invoiceRoutes.get(
  "/subscription/:subscriptionId",
  authMiddleware.requirePermissions([INVOICE_PERMISSIONS.VIEW]),
  asyncHandler(invoiceController.getBySubscription),
);

// Generate or re-generate the demand invoice for a subscription (admin).
invoiceRoutes.post(
  "/subscription/:subscriptionId/generate",
  authMiddleware.requirePermissions([INVOICE_PERMISSIONS.GENERATE]),
  asyncHandler(invoiceController.generate),
);

invoiceRoutes.get(
  "/:id",
  authMiddleware.requirePermissions([INVOICE_PERMISSIONS.VIEW]),
  asyncHandler(invoiceController.getOne),
);

// Edit editable fields / mark paid (admin).
invoiceRoutes.patch(
  "/:id",
  authMiddleware.requirePermissions([INVOICE_PERMISSIONS.EDIT]),
  validate(InvoiceValidation.updateSchema),
  asyncHandler(invoiceController.update),
);

// Send invoice to parent(s) via in-app notification + WhatsApp (admin).
invoiceRoutes.post(
  "/:id/send",
  authMiddleware.requirePermissions([INVOICE_PERMISSIONS.SEND]),
  asyncHandler(invoiceController.send),
);

export default invoiceRoutes;
