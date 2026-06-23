import { z } from "zod";
import { certificateMessagesCodes } from "./certificateTemplate.messages.js";

const optionalText = z.string().trim().optional();

// Opaque style JSON (orientation, colors, decoration, showPhoto, …). Extra keys
// pass through unchanged.
const themeJson = z
  .object({
    orientation: z.string().optional(),
    decoration: z.string().optional(),
    accent: z.string().optional(),
    secondary: z.string().optional(),
    background: z.string().optional(),
    borderStyle: z.string().optional(),
    showPhoto: z.boolean().optional(),
    showBismillah: z.boolean().optional(),
  })
  .passthrough()
  .optional();

export class CertificateTemplateValidation {
  static createSchema = z.object({
    key: z
      .string({ message: certificateMessagesCodes.TEMPLATE_KEY_REQUIRED })
      .trim()
      .min(1, certificateMessagesCodes.TEMPLATE_KEY_REQUIRED),
    nameAr: z
      .string({ message: certificateMessagesCodes.TEMPLATE_NAME_REQUIRED })
      .trim()
      .min(1, certificateMessagesCodes.TEMPLATE_NAME_REQUIRED),
    nameEn: z
      .string({ message: certificateMessagesCodes.TEMPLATE_NAME_REQUIRED })
      .trim()
      .min(1, certificateMessagesCodes.TEMPLATE_NAME_REQUIRED),
    headingAr: optionalText,
    headingEn: optionalText,
    introAr: optionalText,
    introEn: optionalText,
    bodyAr: optionalText,
    bodyEn: optionalText,
    congratsAr: optionalText,
    congratsEn: optionalText,
    thanksAr: optionalText,
    thanksEn: optionalText,
    signatureName: optionalText,
    signatureTitleAr: optionalText,
    signatureTitleEn: optionalText,
    themeJson,
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  });

  static updateSchema = z.object({
    key: z
      .string()
      .trim()
      .min(1, certificateMessagesCodes.TEMPLATE_KEY_REQUIRED)
      .optional(),
    nameAr: z
      .string()
      .trim()
      .min(1, certificateMessagesCodes.TEMPLATE_NAME_REQUIRED)
      .optional(),
    nameEn: z
      .string()
      .trim()
      .min(1, certificateMessagesCodes.TEMPLATE_NAME_REQUIRED)
      .optional(),
    headingAr: optionalText,
    headingEn: optionalText,
    introAr: optionalText,
    introEn: optionalText,
    bodyAr: optionalText,
    bodyEn: optionalText,
    congratsAr: optionalText,
    congratsEn: optionalText,
    thanksAr: optionalText,
    thanksEn: optionalText,
    signatureName: optionalText,
    signatureTitleAr: optionalText,
    signatureTitleEn: optionalText,
    themeJson,
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  });
}
