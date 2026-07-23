import { z } from "zod";
import { authMessagesCodes, BILLING_PERIODS } from "@aya/shared";

const billingPeriods = [BILLING_PERIODS.MONTHLY, BILLING_PERIODS.YEARLY];

export class AuthValidation {
  static registerSchema = z.object({
    name: z.string().min(1, authMessagesCodes.NAME_REQUIRED),
    email: z.string().email(authMessagesCodes.INVALID_EMAIL),
    password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
    phone: z
      .string()
      .trim()
      .min(1, authMessagesCodes.PHONE_REQUIRED)
      .regex(/^\+?[0-9\s\-()]{6,25}$/, authMessagesCodes.INVALID_PHONE),
    locale: z.enum(["ar", "en"]).optional(),
  });

  static loginSchema = z.object({
    email: z.string().email(authMessagesCodes.INVALID_EMAIL),
    password: z.string().min(1, authMessagesCodes.PASSWORD_REQUIRED),
  });

  // Forgot password — ask for a reset link by e-mail. `locale` picks the e-mail
  // language (defaults to the account's stored locale on the server side).
  static forgotPasswordSchema = z.object({
    email: z.string().email(authMessagesCodes.INVALID_EMAIL),
    locale: z.enum(["ar", "en"]).optional(),
  });

  // Reset password — consume the emailed token and set a new password.
  static resetPasswordSchema = z.object({
    token: z.string().min(1, authMessagesCodes.RESET_TOKEN_REQUIRED),
    password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
  });

  // One child in the family-enrollment payload.
  static enrollChildSchema = z.object({
    name: z.string().min(1, authMessagesCodes.NAME_REQUIRED),
    email: z.string().email(authMessagesCodes.INVALID_EMAIL),
    password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
    birthDate: z.coerce.date().optional(),
    nickname: z.string().trim().optional(),
    planId: z.coerce.number().int().positive(authMessagesCodes.PLAN_REQUIRED),
    billingPeriod: z.enum(billingPeriods),
    couponCode: z.string().trim().min(1).optional(),
    applyPlanCoupon: z.boolean().optional(),
  });

  // Public family enrollment: a parent + one or more children, each with a plan.
  static enrollSchema = z.object({
    parent: z.object({
      name: z.string().min(1, authMessagesCodes.NAME_REQUIRED),
      email: z.string().email(authMessagesCodes.INVALID_EMAIL),
      password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
      phone: z
        .string()
        .trim()
        .min(1, authMessagesCodes.PHONE_REQUIRED)
        .regex(/^\+?[0-9\s\-()]{6,25}$/, authMessagesCodes.INVALID_PHONE),
      locale: z.enum(["ar", "en"]).optional(),
    }),
    children: z
      .array(AuthValidation.enrollChildSchema)
      .min(1, authMessagesCodes.NO_CHILDREN),
  });
}
