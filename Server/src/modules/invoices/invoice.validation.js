import { z } from "zod";
import { INVOICE_STATUSES } from "@aya/shared";
import { paymentTemplateConfigSchema } from "../paymentTemplates/paymentTemplate.validation.js";

const statuses = [
  INVOICE_STATUSES.UNPAID,
  INVOICE_STATUSES.PAID,
  INVOICE_STATUSES.VOID,
];

export class InvoiceValidation {
  // Admin edits the editable subset. Hours/rate/subtotal are NOT accepted here —
  // they always derive from the subscription.
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
  });
}
