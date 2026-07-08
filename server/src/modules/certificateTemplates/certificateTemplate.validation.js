import { z } from "zod";
import { CERTIFICATE_TEMPLATE_TYPES, certificateMessagesCodes } from "@aya/shared";

const optionalText = z.string().trim().optional();

// GENERAL (admin-picked) | GAME (auto-applied game template) | EXAM
// (auto-applied quiz template). Only one GAME/EXAM may be active at a time.
const templateType = z
  .enum([
    CERTIFICATE_TEMPLATE_TYPES.GENERAL,
    CERTIFICATE_TEMPLATE_TYPES.GAME,
    CERTIFICATE_TEMPLATE_TYPES.EXAM,
  ])
  .optional();

// Opaque style JSON (orientation, colors, decoration, showPhoto, …). Extra keys
// pass through unchanged; the renderer (CertificateCard) reads them all.
const themeJson = z
  .object({
    orientation: z.string().optional(),
    decoration: z.string().optional(),
    fontStyle: z.string().optional(),
    accent: z.string().optional(),
    secondary: z.string().optional(),
    background: z.string().optional(),
    nameColor: z.string().optional(),
    borderStyle: z.string().optional(),
    logoSize: z.string().optional(),
    sealText: z.string().optional(),
    nameScale: z.number().optional(),
    headingScale: z.number().optional(),
    contentSpacing: z.number().optional(),
    watermarkOpacity: z.number().optional(),
    showPhoto: z.boolean().optional(),
    showBismillah: z.boolean().optional(),
    showSeal: z.boolean().optional(),
    showWatermark: z.boolean().optional(),
    showTagline: z.boolean().optional(),
    showDate: z.boolean().optional(),
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
    type: templateType,
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
    type: templateType,
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
