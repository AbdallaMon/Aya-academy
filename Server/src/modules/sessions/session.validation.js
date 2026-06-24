import { z } from "zod";
import { LESSON_STATUSES, LESSON_ASSIGNMENT_KINDS } from "@aya/shared";
import { sessionMessagesCodes } from "./session.messages.js";

const statuses = [
  LESSON_STATUSES.SCHEDULED,
  LESSON_STATUSES.COMPLETED,
  LESSON_STATUSES.CANCELLED,
  LESSON_STATUSES.MISSED,
];

export class SessionValidation {
  static createSessionSchema = z.object({
    studentId: z.number().int().positive(sessionMessagesCodes.STUDENT_REQUIRED),
    subscriptionId: z.number().int().positive().optional(),
    title: z.string().trim().optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    status: z.enum(statuses).optional(),
    meetingLink: z.string().trim().optional(),
    notes: z.string().optional(),
  });

  static updateSessionSchema = z.object({
    studentId: z.number().int().positive().optional(),
    subscriptionId: z.number().int().positive().optional(),
    title: z.string().trim().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    status: z.enum(statuses).optional(),
    meetingLink: z.string().trim().optional(),
    notes: z.string().optional(),
  });

  static setPlanSchema = z.object({
    homework: z.string().trim().optional(),
    assignments: z
      .array(
        z.object({
          kind: z.enum([LESSON_ASSIGNMENT_KINDS.MEMORIZE, LESSON_ASSIGNMENT_KINDS.REVIEW]),
          surahId: z.number().int().positive(),
          fromAyah: z.number().int().positive().nullable().optional(),
          toAyah: z.number().int().positive().nullable().optional(),
          order: z.number().int().nonnegative().optional(),
        }),
      )
      .optional()
      .default([]),
  });
}
