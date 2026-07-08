import { z } from "zod";
import { gameMessagesCodes } from "@aya/shared";

export class GameValidation {
  static assignSchema = z.object({
    studentIds: z
      .array(z.number().int().positive(gameMessagesCodes.STUDENT_ID_INVALID))
      .min(1, gameMessagesCodes.STUDENT_IDS_REQUIRED),
    dueAt: z.coerce.date().optional(),
  });

  // Link a badge (badgeId) or unlink it (badgeId: null).
  static setBadgeSchema = z.object({
    badgeId: z
      .number()
      .int()
      .positive(gameMessagesCodes.BADGE_ID_INVALID)
      .nullable(),
  });

  static attemptSchema = z.object({
    answersJson: z.any(),
    correctCount: z
      .number()
      .int()
      .min(0, gameMessagesCodes.ATTEMPT_CORRECT_COUNT_INVALID),
    totalQuestions: z
      .number()
      .int()
      .min(0, gameMessagesCodes.ATTEMPT_TOTAL_QUESTIONS_INVALID),
  });
}
