import { z } from "zod";
import { BILLING_PERIODS, planMessagesCodes } from "@ayah/shared";

const billingPeriods = [BILLING_PERIODS.MONTHLY, BILLING_PERIODS.YEARLY];

export class PlanValidation {
  static createPlanSchema = z.object({
    titleAr: z.string().min(1, planMessagesCodes.PLAN_TITLE_REQUIRED),
    titleEn: z.string().min(1, planMessagesCodes.PLAN_TITLE_REQUIRED),
    descriptionAr: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
    // Plan stores ONLY hours; price is derived from the global hourly rate.
    hours: z.number().int().positive(planMessagesCodes.PLAN_HOURS_REQUIRED),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  });

  static updatePlanSchema = z.object({
    titleAr: z.string().min(1, planMessagesCodes.PLAN_TITLE_REQUIRED).optional(),
    titleEn: z.string().min(1, planMessagesCodes.PLAN_TITLE_REQUIRED).optional(),
    descriptionAr: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
    hours: z
      .number()
      .int()
      .positive(planMessagesCodes.PLAN_HOURS_REQUIRED)
      .optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  });

  static quoteSchema = z.object({
    planId: z.coerce.number().int().positive(planMessagesCodes.PLAN_NOT_FOUND),
    billingPeriod: z.enum(billingPeriods),
    couponCode: z.string().trim().min(1).optional(),
  });
}
