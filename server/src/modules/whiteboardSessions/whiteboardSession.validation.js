import { z } from "zod";
import { whiteboardMessagesCodes } from "./whiteboardSession.messages.js";

export class WhiteboardSessionValidation {
  static createSchema = z.object({
    title: z
      .string()
      .trim()
      .min(1, whiteboardMessagesCodes.TITLE_REQUIRED)
      .max(120),
  });

  static addStudentSchema = z.object({
    studentId: z
      .number()
      .int()
      .positive(whiteboardMessagesCodes.STUDENT_ID_INVALID),
  });
}
