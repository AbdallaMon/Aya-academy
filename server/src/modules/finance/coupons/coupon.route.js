import { Router } from "express";
import { PERMISSIONS } from "@aya/shared";
import { couponController } from "./coupon.controller.js";
import { CouponValidation } from "./coupon.validation.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const couponRoutes = Router();

// Any authenticated user may validate a coupon — must be declared before "/:id".
couponRoutes.post(
  "/validate",
  authMiddleware.requireAuth,
  validate(CouponValidation.validateCouponSchema),
  asyncHandler(couponController.validate),
);

couponRoutes.get(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.COUPON.LIST]),
  asyncHandler(couponController.list),
);

couponRoutes.post(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.COUPON.CREATE]),
  validate(CouponValidation.createCouponSchema),
  asyncHandler(couponController.create),
);

couponRoutes.get(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.COUPON.VIEW]),
  asyncHandler(couponController.getOne),
);

couponRoutes.put(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.COUPON.EDIT]),
  validate(CouponValidation.updateCouponSchema),
  asyncHandler(couponController.update),
);

couponRoutes.delete(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.COUPON.DELETE]),
  asyncHandler(couponController.remove),
);

export default couponRoutes;
