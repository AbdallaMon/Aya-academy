import { z } from "zod";
import {
  CURRENCY_OPTIONS,
  settingsMessagesCodes,
  WHITEBOARD_RETENTION_MAX_DAYS,
  WHITEBOARD_RETENTION_MIN_DAYS,
} from "@ayah/shared";

export class SettingsValidation {
  static updateSchema = z.object({
    hourlyRate: z.coerce
      .number({ message: settingsMessagesCodes.INVALID_HOURLY_RATE })
      .positive(settingsMessagesCodes.INVALID_HOURLY_RATE)
      .optional(),
    currency: z
      .enum(CURRENCY_OPTIONS, { message: settingsMessagesCodes.INVALID_CURRENCY })
      .optional(),
    whiteboardRetentionDays: z.coerce
      .number({ message: settingsMessagesCodes.INVALID_RETENTION_DAYS })
      .int(settingsMessagesCodes.INVALID_RETENTION_DAYS)
      .min(WHITEBOARD_RETENTION_MIN_DAYS, settingsMessagesCodes.INVALID_RETENTION_DAYS)
      .max(WHITEBOARD_RETENTION_MAX_DAYS, settingsMessagesCodes.INVALID_RETENTION_DAYS)
      .optional(),
  });
}
