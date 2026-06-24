import { z } from "zod";
import { SEGMENT_STATUSES } from "@aya/shared";

export class QuranValidation {
  static setJuzProgressSchema = z.object({
    items: z
      .array(
        z.object({
          segmentId: z.number().int().positive(),
          // null clears the segment (NOT_STARTED)
          status: z.enum([SEGMENT_STATUSES.IN_PROGRESS, SEGMENT_STATUSES.COMPLETED]).nullable(),
          currentAyah: z.number().int().positive().nullable().optional(),
        }),
      )
      .min(1),
  });
}
