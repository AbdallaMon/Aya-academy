import { z } from "zod";
import {
  BILLING_PERIODS,
  DISCOUNT_CONSTRAINTS,
  DISCOUNT_TYPES,
} from "@aya/shared";
import { planMessagesCodes } from "./plan.messages.js";

const billingPeriods = [BILLING_PERIODS.MONTHLY, BILLING_PERIODS.YEARLY];

const discountTypes = [DISCOUNT_TYPES.PERCENT, DISCOUNT_TYPES.FIXED];

const discountConstraints = [
  DISCOUNT_CONSTRAINTS.COUNT,
  DISCOUNT_CONSTRAINTS.DURATION,
];

export class PlanValidation {
  static createPlanSchema = z.object({
    titleAr: z.string().min(1, planMessagesCodes.PLAN_TITLE_REQUIRED),
    titleEn: z.string().min(1, planMessagesCodes.PLAN_TITLE_REQUIRED),
    descriptionAr: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
    billingPeriod: z.enum(billingPeriods, {
      message: planMessagesCodes.PLAN_BILLING_PERIOD_REQUIRED,
    }),
    hours: z.number().int().positive(planMessagesCodes.PLAN_HOURS_REQUIRED),
    hourlyRate: z.number().positive(planMessagesCodes.PLAN_RATE_REQUIRED),
    currency: z.string().trim().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  });

  static updatePlanSchema = z.object({
    titleAr: z.string().min(1, planMessagesCodes.PLAN_TITLE_REQUIRED).optional(),
    titleEn: z.string().min(1, planMessagesCodes.PLAN_TITLE_REQUIRED).optional(),
    descriptionAr: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
    billingPeriod: z.enum(billingPeriods).optional(),
    hours: z
      .number()
      .int()
      .positive(planMessagesCodes.PLAN_HOURS_REQUIRED)
      .optional(),
    hourlyRate: z
      .number()
      .positive(planMessagesCodes.PLAN_RATE_REQUIRED)
      .optional(),
    currency: z.string().trim().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  });

  static createDiscountSchema = z.object({
    type: z.enum(discountTypes, {
      message: planMessagesCodes.DISCOUNT_TYPE_REQUIRED,
    }),
    value: z.number().positive(planMessagesCodes.DISCOUNT_VALUE_REQUIRED),
    constraint: z.enum(discountConstraints, {
      message: planMessagesCodes.DISCOUNT_CONSTRAINT_REQUIRED,
    }),
    maxRedemptions: z.number().int().positive().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  });

  static updateDiscountSchema = z.object({
    type: z.enum(discountTypes).optional(),
    value: z
      .number()
      .positive(planMessagesCodes.DISCOUNT_VALUE_REQUIRED)
      .optional(),
    constraint: z.enum(discountConstraints).optional(),
    maxRedemptions: z.number().int().positive().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  });
}
