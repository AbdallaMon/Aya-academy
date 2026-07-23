import { z } from "zod";
import {
  SESSION_ATTENDANCE,
  SESSION_RATINGS,
  SESSION_SUBJECTS,
  sessionLogMessagesCodes,
} from "@aya/shared";

const SUBJECT_VALUES = Object.values(SESSION_SUBJECTS);
const RATING_VALUES = Object.values(SESSION_RATINGS);
const ATTENDANCE_VALUES = Object.values(SESSION_ATTENDANCE);

const subjectsSchema = z
  .array(z.string())
  .min(1, sessionLogMessagesCodes.SUBJECTS_REQUIRED)
  .refine((arr) => arr.every((s) => SUBJECT_VALUES.includes(s)), {
    message: sessionLogMessagesCodes.INVALID_SUBJECT,
  });

const durationMinutesSchema = z.coerce
  .number({ error: sessionLogMessagesCodes.DURATION_REQUIRED })
  .int(sessionLogMessagesCodes.DURATION_INVALID)
  .positive(sessionLogMessagesCodes.DURATION_INVALID)
  .max(24 * 60, sessionLogMessagesCodes.DURATION_INVALID);

// Temporary write compatibility for older clients. The usecase immediately
// converts this value to canonical integer minutes and never writes legacy hours.
const durationHoursSchema = z.coerce
  .number({ error: sessionLogMessagesCodes.DURATION_REQUIRED })
  .positive(sessionLogMessagesCodes.DURATION_INVALID)
  .max(24, sessionLogMessagesCodes.DURATION_INVALID);

const ratingSchema = z
  .string()
  .refine((v) => RATING_VALUES.includes(v), {
    message: sessionLogMessagesCodes.RATING_INVALID,
  });

const attendanceSchema = z
  .string()
  .refine((v) => ATTENDANCE_VALUES.includes(v), {
    message: sessionLogMessagesCodes.ATTENDANCE_INVALID,
  });

export class SessionLogValidation {
  static createSessionLogSchema = z
    .object({
      studentId: z.coerce
        .number({ error: sessionLogMessagesCodes.STUDENT_REQUIRED })
        .int()
        .positive(sessionLogMessagesCodes.STUDENT_REQUIRED),
      subjects: subjectsSchema,
      durationMinutes: durationMinutesSchema.optional(),
      durationHours: durationHoursSchema.optional(),
      rating: ratingSchema.optional(),
      report: z.string().optional(),
      attendance: attendanceSchema.default(SESSION_ATTENDANCE.PRESENT),
      teacherId: z.coerce.number().int().positive().optional(),
      sessionDate: z.coerce.date({
        error: sessionLogMessagesCodes.SESSION_DATE_REQUIRED,
      }),
    })
    .refine(
      (value) =>
        value.durationMinutes !== undefined || value.durationHours !== undefined,
      {
        message: sessionLogMessagesCodes.DURATION_REQUIRED,
        path: ["durationMinutes"],
      },
    );

  static updateSessionLogSchema = z.object({
    studentId: z.coerce.number().int().positive().optional(),
    subjects: subjectsSchema.optional(),
    durationMinutes: durationMinutesSchema.optional(),
    durationHours: durationHoursSchema.optional(),
    rating: ratingSchema.optional(),
    report: z.string().optional(),
    attendance: attendanceSchema.optional(),
    teacherId: z.coerce.number().int().positive().optional(),
    sessionDate: z.coerce
      .date({ error: sessionLogMessagesCodes.SESSION_DATE_REQUIRED })
      .optional(),
  });
}
