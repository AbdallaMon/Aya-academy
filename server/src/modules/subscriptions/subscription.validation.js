import { z } from "zod";
import { BILLING_PERIODS, SUBSCRIPTION_STATUSES } from "@aya/shared";
import { subscriptionMessagesCodes } from "./subscription.messages.js";

const statuses = [
  SUBSCRIPTION_STATUSES.PENDING,
  SUBSCRIPTION_STATUSES.UPCOMING,
  SUBSCRIPTION_STATUSES.ACTIVE,
  SUBSCRIPTION_STATUSES.EXPIRED,
  SUBSCRIPTION_STATUSES.CANCELLED,
];

const billingPeriods = [BILLING_PERIODS.MONTHLY, BILLING_PERIODS.YEARLY];

export class SubscriptionValidation {
  static createSubscriptionSchema = z.object({
    studentId: z
      .number()
      .int()
      .positive(subscriptionMessagesCodes.STUDENT_REQUIRED),
    planId: z.number().int().positive().optional(),
    billingPeriod: z.enum(billingPeriods).optional(),
    status: z.enum(statuses).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    totalHours: z.number().int().optional(),
    remainingHours: z.number().int().optional(),
    priceCharged: z.number().optional(),
    couponId: z.number().int().positive().optional(),
    couponCode: z.string().trim().min(1).optional(),
    notes: z.string().optional(),
  });

  static updateSubscriptionSchema = z.object({
    studentId: z.number().int().positive().optional(),
    planId: z.number().int().positive().optional(),
    billingPeriod: z.enum(billingPeriods).optional(),
    status: z.enum(statuses).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    totalHours: z.number().int().optional(),
    remainingHours: z.number().int().optional(),
    priceCharged: z.number().optional(),
    couponId: z.number().int().positive().optional(),
    notes: z.string().optional(),
  });

  // Parent requests a plan for one of their children → creates a PENDING sub.
  // Dates/hours/price are derived from the chosen plan server-side.
  static requestSubscriptionSchema = z.object({
    studentId: z
      .number()
      .int()
      .positive(subscriptionMessagesCodes.STUDENT_REQUIRED),
    planId: z.number().int().positive(subscriptionMessagesCodes.PLAN_REQUIRED),
    billingPeriod: z.enum(billingPeriods).optional(),
    startDate: z.coerce.date().optional(),
    couponCode: z.string().trim().min(1).optional(),
    notes: z.string().optional(),
  });

  // Admin approves a PENDING request; may adjust the charged price / add a note.
  static approveSubscriptionSchema = z.object({
    priceCharged: z.number().optional(),
    notes: z.string().optional(),
  });

  // Admin rejects a PENDING request with an optional reason.
  static rejectSubscriptionSchema = z.object({
    reason: z.string().optional(),
  });

  // Renew a subscription → creates a NEW PENDING subscription for the same
  // student. Plan/period/coupon default from the source sub and may be
  // overridden. `allowWhileActive` bypasses the still-active guard.
  static renewSubscriptionSchema = z.object({
    planId: z.number().int().positive().optional(),
    billingPeriod: z.enum(billingPeriods).optional(),
    couponCode: z.string().trim().min(1).optional(),
    startDate: z.coerce.date().optional(),
    allowWhileActive: z.boolean().optional(),
  });

  // Change the plan/period/coupon of a not-yet-paid subscription; recomputes
  // price/hours/dates and regenerates the demand invoice.
  static changePlanSchema = z.object({
    planId: z.number().int().positive(subscriptionMessagesCodes.PLAN_REQUIRED),
    billingPeriod: z.enum(billingPeriods).optional(),
    couponCode: z.string().trim().min(1).optional(),
  });

  // Admin activates a PENDING/UPCOMING subscription, optionally marking its
  // demand invoice paid in the same action.
  static activateSubscriptionSchema = z.object({
    markInvoicePaid: z.boolean().optional(),
  });

  // Apply / replace / remove the single coupon on a not-yet-paid subscription.
  // couponCode is OPTIONAL — empty/absent/null removes the coupon (base price).
  static applyCouponSchema = z.object({
    couponCode: z.string().trim().optional().nullable(),
  });
}
