import { z } from "zod";
import { certificateMessagesCodes } from "@aya/shared";

export class CertificateValidation {
  // Admin manually creating a MANUAL certificate for a student.
  // At least one of titleAr / titleEn must be present.
  static createManualSchema = z
    .object({
      studentId: z
        .number({ message: certificateMessagesCodes.CERTIFICATE_STUDENT_REQUIRED })
        .int()
        .positive(certificateMessagesCodes.CERTIFICATE_STUDENT_REQUIRED),
      titleAr: z.string().trim().min(1).optional(),
      titleEn: z.string().trim().min(1).optional(),
      studentName: z.string().trim().min(1).optional(),
      // Optional body / message text shown on the certificate.
      bodyAr: z.string().trim().optional(),
      bodyEn: z.string().trim().optional(),
      // Decoration template id (e.g. "stars", "rainbow", "classic").
      templateKey: z.string().trim().optional(),
      // Optional reusable certificate template (carries the fixed copy + style).
      templateId: z.number().int().positive().optional(),
      // Dynamic per-certificate purpose/reason (interpolated into the template
      // {reason} token at render time).
      reasonAr: z.string().trim().optional(),
      reasonEn: z.string().trim().optional(),
      // Optional badge granted to the student together with this certificate.
      badgeId: z.number().int().positive().optional(),
      // Optional student photo (Attachment) shown on the certificate.
      photoId: z.number().int().positive().optional(),
      // Decoration / color choices — opaque JSON persisted on the certificate.
      // The frontend sends { accent, background, decoration }; extra keys pass through.
      themeJson: z
        .object({
          accent: z.string().optional(),
          background: z.string().optional(),
          decoration: z.string().optional(),
        })
        .passthrough()
        .optional(),
    })
    // A title is required ONLY for free-form certificates. When a reusable
    // template is selected, the heading/copy comes from the template, so the
    // title is optional (this was rejecting valid template-driven requests).
    .refine((data) => Boolean(data.titleAr || data.titleEn || data.templateId), {
      message: certificateMessagesCodes.CERTIFICATE_TITLE_REQUIRED,
      path: ["titleAr"],
    });
}
