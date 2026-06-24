import { z } from "zod";
import { gameMessagesCodes } from "./game.messages.js";

export class GameValidation {
  static assignSchema = z.object({
    studentIds: z
      .array(z.number().int().positive(gameMessagesCodes.STUDENT_ID_INVALID))
      .min(1, gameMessagesCodes.STUDENT_IDS_REQUIRED),
    dueAt: z.coerce.date().optional(),
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
