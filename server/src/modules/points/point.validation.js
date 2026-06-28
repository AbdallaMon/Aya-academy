import { z } from "zod";
import { pointMessagesCodes } from "./point.messages.js";

export class PointValidation {
  // Admin manually awards/adjusts a student's points.
  static awardPointsSchema = z.object({
    studentId: z
      .number()
      .int()
      .positive(pointMessagesCodes.STUDENT_REQUIRED),
    amount: z
      .number()
      .int(pointMessagesCodes.INVALID_AMOUNT)
      .refine((n) => n !== 0, pointMessagesCodes.INVALID_AMOUNT),
    reason: z.string().trim().optional(),
  });
}
