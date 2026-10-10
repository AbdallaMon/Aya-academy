import { z } from "zod";
import { CURRENCY_OPTIONS, INVOICE_STATUSES } from "@ayah/shared";
import { paymentTemplateConfigSchema } from "../paymentTemplates/paymentTemplate.validation.js";

const statuses = [
  INVOICE_STATUSES.UNPAID,
  INVOICE_STATUSES.PAID,
  INVOICE_STATUSES.VOID,
];
const centsOnly = (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7;

export class InvoiceValidation {
  // Pricing is an optional, invoice-only override before the first send.
  static updateSchema = z.object({
    configJson: paymentTemplateConfigSchema.optional(),
    previousCredit: z.coerce.number().min(0).optional(),
    previousDebt: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
    billingPeriodLabel: z.string().optional(),
    dueDate: z.coerce.date().optional(),
    status: z.enum(statuses).optional(),
    // When marking PAID, optionally activate the linked subscription.
    activateSubscription: z.boolean().optional(),
    pricing: z.object({
      minutes: z.number().int().positive().max(59_999_999),
      hourlyRate: z.number().positive().max(99_999_999.99).refine(centsOnly),
      currency: z.enum(CURRENCY_OPTIONS),
      discountMode: z.enum(["APPLIED", "MANUAL"]).optional(),
      manualDiscountAmount: z.number().finite().min(0).max(99_999_999.99).refine(centsOnly).optional(),
      adjustmentAmount: z.number().finite().min(-99_999_999.99).max(99_999_999.99).refine(centsOnly),
      adjustmentReason: z.string().trim().max(500),
    }).optional(),
  });
}
