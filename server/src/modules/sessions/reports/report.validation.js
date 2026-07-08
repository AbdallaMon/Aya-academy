import { z } from "zod";
import { reportMessagesCodes } from "@aya/shared";

export class ReportValidation {
  static createReportSchema = z.object({
    title: z.string().min(1, reportMessagesCodes.REPORT_TITLE_REQUIRED),
    body: z.string().min(1, reportMessagesCodes.REPORT_BODY_REQUIRED),
    reportDate: z.coerce.date().optional(),
    studentIds: z
      .array(z.number().int().positive())
      .min(1, reportMessagesCodes.STUDENTS_REQUIRED),
    attachmentIds: z.array(z.number().int().positive()).optional(),
  });

  static updateReportSchema = z.object({
    title: z.string().min(1, reportMessagesCodes.REPORT_TITLE_REQUIRED).optional(),
    body: z.string().min(1, reportMessagesCodes.REPORT_BODY_REQUIRED).optional(),
    reportDate: z.coerce.date().optional(),
    studentIds: z.array(z.number().int().positive()).optional(),
    attachmentIds: z.array(z.number().int().positive()).optional(),
  });
}
