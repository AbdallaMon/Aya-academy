import { z } from "zod";
import { CURRENCY_OPTIONS, settingsMessagesCodes } from "@aya/shared";

export class SettingsValidation {
  static updateSchema = z.object({
    hourlyRate: z.coerce
      .number({ message: settingsMessagesCodes.INVALID_HOURLY_RATE })
      .positive(settingsMessagesCodes.INVALID_HOURLY_RATE)
      .optional(),
    currency: z
      .enum(CURRENCY_OPTIONS, { message: settingsMessagesCodes.INVALID_CURRENCY })
      .optional(),
  });
}
