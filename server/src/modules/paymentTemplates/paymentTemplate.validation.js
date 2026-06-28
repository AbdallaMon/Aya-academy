import { z } from "zod";

const noteSchema = z.object({
  ar: z.string().optional().default(""),
  en: z.string().optional().default(""),
});

// The template config is a structured-but-tolerant JSON object. Unknown keys are
// passed through so the shape can evolve without a validation change.
export const paymentTemplateConfigSchema = z
  .object({
    company: z
      .object({
        nameAr: z.string().optional().default(""),
        nameEn: z.string().optional().default(""),
        addressAr: z.string().optional().default(""),
        addressEn: z.string().optional().default(""),
        phone: z.string().optional().default(""),
        email: z.string().optional().default(""),
        logoUrl: z.string().optional().default(""),
      })
      .partial()
      .optional(),
    theme: z
      .object({
        headerColor: z.string().optional(),
        headerTextColor: z.string().optional(),
        accentColor: z.string().optional(),
        textColor: z.string().optional(),
      })
      .partial()
      .optional(),
    fees: z
      .object({
        transferFeePercent: z.coerce.number().min(0).optional(),
        transferFeeFixed: z.coerce.number().min(0).optional(),
      })
      .partial()
      .optional(),
    notes: z.array(noteSchema).optional(),
    footerAr: z.string().optional(),
    footerEn: z.string().optional(),
    paymentInstructionsAr: z.string().optional(),
    paymentInstructionsEn: z.string().optional(),
    dueDays: z.coerce.number().int().min(0).optional(),
    showPreviousCredit: z.boolean().optional(),
    showPreviousDebt: z.boolean().optional(),
  })
  .passthrough();

export class PaymentTemplateValidation {
  static updateSchema = z.object({
    configJson: paymentTemplateConfigSchema,
  });
}
