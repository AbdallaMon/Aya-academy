import { z } from "zod";
import { whiteboardMessagesCodes } from "@ayah/shared";

export class WhiteboardSessionValidation {
  static createSchema = z.object({
    title: z
      .string()
      .trim()
      .min(1, whiteboardMessagesCodes.TITLE_REQUIRED)
      .max(120),
    studentIds: z
      .array(
        z.number().int().positive(whiteboardMessagesCodes.STUDENT_ID_INVALID),
      )
      .optional()
      .default([]),
    isPublic: z.boolean().optional().default(false),
  });

  static addStudentSchema = z.object({
    studentId: z
      .number()
      .int()
      .positive(whiteboardMessagesCodes.STUDENT_ID_INVALID),
  });

  // boardData is a free-form JSON object: { elements, appState, imageMap, files }
  static saveBoardDataSchema = z.object({
    boardData: z.record(z.unknown()),
  });

  static saveLibrarySchema = z.object({
    libraryItems: z
      .array(z.unknown())
      .max(500, whiteboardMessagesCodes.LIBRARY_ITEMS_INVALID),
  });
}
