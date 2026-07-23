import { Router } from "express";
import { SUBSCRIPTION_PERMISSIONS } from "@aya/shared";
import { subscriptionController } from "./subscription.controller.js";
import { SubscriptionValidation } from "./subscription.validation.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const subscriptionRoutes = Router();

subscriptionRoutes.use(authMiddleware.requireAuth);

subscriptionRoutes.get(
  "/",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.LIST]),
  asyncHandler(subscriptionController.list),
);

subscriptionRoutes.get(
  "/expiring",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.LIST]),
  asyncHandler(subscriptionController.expiring),
);

subscriptionRoutes.get(
  "/plan-options/:studentId",
  authMiddleware.requireAnyPermission([
    SUBSCRIPTION_PERMISSIONS.CREATE,
    SUBSCRIPTION_PERMISSIONS.REQUEST,
    SUBSCRIPTION_PERMISSIONS.EDIT,
  ]),
  validate(SubscriptionValidation.planOptionsParamsSchema, "params"),
  asyncHandler(subscriptionController.planOptions),
);

subscriptionRoutes.post(
  "/plan-quote",
  authMiddleware.requireAnyPermission([
    SUBSCRIPTION_PERMISSIONS.CREATE,
    SUBSCRIPTION_PERMISSIONS.REQUEST,
    SUBSCRIPTION_PERMISSIONS.EDIT,
  ]),
  validate(SubscriptionValidation.planQuoteSchema),
  asyncHandler(subscriptionController.planQuote),
);

subscriptionRoutes.get(
  "/:id",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.VIEW]),
  asyncHandler(subscriptionController.getOne),
);

// Live accumulating-bill preview for a USAGE subscription (same read scope as
// GET /:id — object scope is enforced in the usecase via assertCanAccess).
subscriptionRoutes.get(
  "/:id/usage-preview",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.VIEW]),
  asyncHandler(subscriptionController.usagePreview),
);

subscriptionRoutes.post(
  "/",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.CREATE]),
  validate(SubscriptionValidation.createSubscriptionSchema),
  asyncHandler(subscriptionController.create),
);

// Parent requests a plan for a child → PENDING.
subscriptionRoutes.post(
  "/request",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.REQUEST]),
  validate(SubscriptionValidation.requestSubscriptionSchema),
  asyncHandler(subscriptionController.request),
);

// Admin approves / rejects a PENDING request.
subscriptionRoutes.post(
  "/:id/approve",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.APPROVE]),
  validate(SubscriptionValidation.approveSubscriptionSchema),
  asyncHandler(subscriptionController.approve),
);

subscriptionRoutes.post(
  "/:id/reject",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.APPROVE]),
  validate(SubscriptionValidation.rejectSubscriptionSchema),
  asyncHandler(subscriptionController.reject),
);

// Admin cancels a subscription (status → CANCELLED) from an active-ish state.
subscriptionRoutes.post(
  "/:id/cancel",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.CANCEL]),
  asyncHandler(subscriptionController.cancel),
);

// Renew a subscription → new PENDING sub. Admin (RENEW) or parent (REQUEST);
// the usecase scope-checks that a parent owns the source subscription's child.
subscriptionRoutes.post(
  "/:id/renew",
  authMiddleware.requireAnyPermission([
    SUBSCRIPTION_PERMISSIONS.RENEW,
    SUBSCRIPTION_PERMISSIONS.REQUEST,
  ]),
  validate(SubscriptionValidation.renewSubscriptionSchema),
  asyncHandler(subscriptionController.renew),
);

// Change the plan of a not-yet-paid subscription → regenerates the invoice.
subscriptionRoutes.post(
  "/:id/change-plan",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.EDIT]),
  validate(SubscriptionValidation.changePlanSchema),
  asyncHandler(subscriptionController.changePlan),
);

// Apply / replace / remove the single coupon on a not-yet-paid subscription.
// Admin (EDIT) or parent (REQUEST); object scope is enforced in the usecase.
subscriptionRoutes.post(
  "/:id/apply-coupon",
  authMiddleware.requireAnyPermission([
    SUBSCRIPTION_PERMISSIONS.EDIT,
    SUBSCRIPTION_PERMISSIONS.REQUEST,
  ]),
  validate(SubscriptionValidation.applyCouponSchema),
  asyncHandler(subscriptionController.applyCoupon),
);

// Admin activates a PENDING/UPCOMING subscription (optionally marking it paid).
subscriptionRoutes.post(
  "/:id/activate",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.ACTIVATE]),
  validate(SubscriptionValidation.activateSubscriptionSchema),
  asyncHandler(subscriptionController.activate),
);

subscriptionRoutes.put(
  "/:id",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.EDIT]),
  validate(SubscriptionValidation.updateSubscriptionSchema),
  asyncHandler(subscriptionController.update),
);

subscriptionRoutes.delete(
  "/:id",
  authMiddleware.requirePermissions([SUBSCRIPTION_PERMISSIONS.DELETE]),
  asyncHandler(subscriptionController.remove),
);

export default subscriptionRoutes;
