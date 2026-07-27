import { Router } from "express";
import { messagesNames } from "@aya/shared";
import { authController } from "./auth.controller.js";
import { AuthValidation } from "./auth.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import {
  loginRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
} from "../../shared/middlewares/rate-limit.middleware.js";

const authRoutes = Router();

authRoutes.post(
  "/register",
  registrationRateLimiter,
  validate(AuthValidation.registerSchema, "body", messagesNames.authMessages),
  asyncHandler(authController.register),
);

authRoutes.post(
  "/enroll",
  registrationRateLimiter,
  validate(AuthValidation.enrollSchema, "body", messagesNames.authMessages),
  asyncHandler(authController.enroll),
);

authRoutes.post(
  "/login",
  loginRateLimiter,
  validate(AuthValidation.loginSchema, "body", messagesNames.authMessages),
  asyncHandler(authController.login),
);

authRoutes.post(
  "/forgot-password",
  passwordResetRateLimiter,
  validate(
    AuthValidation.forgotPasswordSchema,
    "body",
    messagesNames.authMessages,
  ),
  asyncHandler(authController.forgotPassword),
);

authRoutes.post(
  "/reset-password",
  validate(AuthValidation.resetPasswordSchema, "body", messagesNames.authMessages),
  asyncHandler(authController.resetPassword),
);

authRoutes.post("/logout", asyncHandler(authController.logout));
authRoutes.post("/refresh", asyncHandler(authController.refresh));

authRoutes.get(
  "/me",
  authMiddleware.requireAuth,
  asyncHandler(authController.me),
);

export default authRoutes;
