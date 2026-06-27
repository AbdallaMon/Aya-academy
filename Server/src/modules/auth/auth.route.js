import { Router } from "express";
import { authController } from "./auth.controller.js";
import { AuthValidation } from "./auth.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const authRoutes = Router();

authRoutes.post(
  "/register",
  validate(AuthValidation.registerSchema),
  asyncHandler(authController.register),
);

authRoutes.post(
  "/enroll",
  validate(AuthValidation.enrollSchema),
  asyncHandler(authController.enroll),
);

authRoutes.post(
  "/login",
  validate(AuthValidation.loginSchema),
  asyncHandler(authController.login),
);

authRoutes.post("/logout", asyncHandler(authController.logout));
authRoutes.post("/refresh", asyncHandler(authController.refresh));

authRoutes.get(
  "/me",
  authMiddleware.requireAuth,
  asyncHandler(authController.me),
);

export default authRoutes;
