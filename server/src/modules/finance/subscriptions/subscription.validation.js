import { z } from "zod";
import {
  BILLING_PERIODS,
  SUBSCRIPTION_STATUSES,
  subscriptionMessagesCodes,
} from "@aya/shared";

const statuses = [
  SUBSCRIPTION_STATUSES.PENDING,
  SUBSCRIPTION_STATUSES.UPCOMING,
  SUBSCRIPTION_STATUSES.ACTIVE,
  SUBSCRIPTION_STATUSES.EXPIRED,
  SUBSCRIPTION_STATUSES.CANCELLED,
];

const billingPeriods = [BILLING_PERIODS.MONTHLY, BILLING_PERIODS.YEARLY];

export class SubscriptionValidation {
  static createSubscriptionSchema = z
    .object({
      studentId: z
        .number()
        .int()
        .positive(subscriptionMessagesCodes.STUDENT_REQUIRED),
      planId: z.number().int().positive().optional(),
      billingPeriod: z.enum(billingPeriods).optional(),
      status: z.enum(statuses).optional(),
      // Month-based create. Two shapes share the `month` field (startDate/endDate
      // are derived server-side as 1st → last day and ignored when `month` is set):
      //   • planId + month  → create-by-plan (v3, the admin form): hours + price
      //     come from the plan; USAGE sub with the plan linked (couponCode optional).
      //   • month only      → legacy USAGE arrears: hours from the student's
      //     sessions in the previous month.
      // Accepts an ISO date or `YYYY-MM`.
      month: z.coerce.date().optional(),
      // Legacy plan-based path: explicit dates. Optional so the month path
      // validates; required (via refine) when `month` is absent.
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      subsMinutes: z.number().int().min(0).optional(),
      remainingMinutes: z.number().int().min(0).optional(),
      // Temporary compatibility for older API clients; converted to minutes in
      // the usecase and never written to the legacy columns.
      subsHours: z.number().optional(),
      remainingHours: z.number().optional(),
      priceCharged: z.number().min(0).optional(),
      couponId: z.number().int().positive().optional(),
      couponCode: z.string().trim().min(1).optional(),
      applyPlanCoupon: z.boolean().optional(),
      notes: z.string().optional(),
    })
    .refine(
      (v) => v.month != null || (v.startDate != null && v.endDate != null),
      {
        message: subscriptionMessagesCodes.INVALID_DATE_RANGE,
        path: ["month"],
      },
    );

  // Manual edit path. subsMinutes (the invoiced duration) is intentionally NOT
  // accepted here — it is set only by the automatic hours writes (create-by-plan
  // from the plan, recompute/freeze from sessions). Only remainingHours is
  // manually editable (must stay >= 0).
  static updateSubscriptionSchema = z
    .object({
      // Workflow-owned fields (student/plan/status/dates/price/coupon) are not
      // accepted here. Their dedicated actions enforce invoice invariants.
      remainingMinutes: z.number().int().min(0).optional(),
      remainingHours: z.number().min(0).optional(),
      notes: z.string().optional(),
    })
    .refine(
      (value) =>
        value.remainingMinutes !== undefined ||
        value.remainingHours !== undefined ||
        value.notes !== undefined,
      { message: subscriptionMessagesCodes.NO_EDITABLE_FIELDS },
    );

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
    applyPlanCoupon: z.boolean().optional(),
    notes: z.string().optional(),
  });

  // Admin approves a PENDING request; may adjust the charged price / add a note.
  static approveSubscriptionSchema = z.object({
    priceCharged: z.number().min(0).optional(),
    notes: z.string().optional(),
  });

  // Admin rejects a PENDING request with an optional reason.
  static rejectSubscriptionSchema = z.object({
    reason: z.string().optional(),
  });

  // Renew a subscription → creates a NEW PENDING subscription for the same
  // student. Plan/period/coupon default from the source sub and may be
  // overridden. A new subscription is BLOCKED while an active one exists, and
  // AUTO-REPLACES any in-flight PENDING one (handled in the usecase).
  static renewSubscriptionSchema = z.object({
    planId: z.number().int().positive().optional(),
    billingPeriod: z.enum(billingPeriods).optional(),
    couponCode: z.string().trim().min(1).optional(),
    applyPlanCoupon: z.boolean().optional(),
    startDate: z.coerce.date().optional(),
  });

  // Change the plan/period/coupon of a not-yet-paid subscription; recomputes
  // price/hours/dates and regenerates the demand invoice.
  static changePlanSchema = z.object({
    planId: z.number().int().positive(subscriptionMessagesCodes.PLAN_REQUIRED),
    billingPeriod: z.enum(billingPeriods).optional(),
    couponCode: z.string().trim().min(1).optional(),
    applyPlanCoupon: z.boolean().optional(),
  });

  static planOptionsParamsSchema = z.object({
    studentId: z.coerce.number().int().positive(),
  });

  static planQuoteSchema = z.object({
    studentId: z.number().int().positive(),
    planId: z.number().int().positive(),
    couponCode: z.string().trim().optional().nullable(),
    currentSubscriptionId: z.number().int().positive().optional(),
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
