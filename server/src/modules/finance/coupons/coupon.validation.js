import { z } from "zod";
import {
  BILLING_PERIODS,
  COUPON_SOURCES,
  DISCOUNT_TYPES,
  couponMessagesCodes,
} from "@ayah/shared";

const discountTypes = [DISCOUNT_TYPES.PERCENT, DISCOUNT_TYPES.FIXED];

const billingPeriods = [BILLING_PERIODS.MONTHLY, BILLING_PERIODS.YEARLY];

const couponSources = [
  COUPON_SOURCES.MANUAL,
  COUPON_SOURCES.GAME_REWARD,
  COUPON_SOURCES.QUIZ_REWARD,
  COUPON_SOURCES.ADMIN_GIFT,
];

export class CouponValidation {
  static createCouponSchema = z.object({
    // Optional — when omitted the server generates a unique code.
    code: z.string().min(3, couponMessagesCodes.COUPON_CODE_REQUIRED).optional(),
    type: z.enum(discountTypes, {
      message: couponMessagesCodes.COUPON_INVALID,
    }),
    value: z.number().positive(couponMessagesCodes.COUPON_INVALID),
    source: z.enum(couponSources).optional(),
    billingPeriod: z.enum(billingPeriods).nullable().optional(),
    maxRedemptions: z.number().int().positive().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    planIds: z.array(z.number().int().positive()).optional(),
  });

  static updateCouponSchema = z.object({
    code: z
      .string()
      .min(3, couponMessagesCodes.COUPON_CODE_REQUIRED)
      .optional(),
    type: z.enum(discountTypes).optional(),
    value: z.number().positive(couponMessagesCodes.COUPON_INVALID).optional(),
    source: z.enum(couponSources).optional(),
    billingPeriod: z.enum(billingPeriods).nullable().optional(),
    maxRedemptions: z.number().int().positive().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    planIds: z.array(z.number().int().positive()).optional(),
  });

  static validateCouponSchema = z.object({
    code: z.string().min(1, couponMessagesCodes.COUPON_CODE_REQUIRED),
    planId: z.number().int().positive().optional(),
    billingPeriod: z.enum(billingPeriods).optional(),
  });
}
