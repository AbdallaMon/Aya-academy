import { z } from "zod";
import { badgeMessagesCodes } from "./badge.messages.js";

const hexColor = z
  .string()
  .trim()
  .regex(/^#?[0-9a-fA-F]{3,8}$/)
  .optional();

export class BadgeValidation {
  static createBadgeSchema = z.object({
    code: z.string().trim().min(1, badgeMessagesCodes.BADGE_CODE_REQUIRED),
    nameAr: z.string().trim().min(1, badgeMessagesCodes.BADGE_NAME_REQUIRED),
    nameEn: z.string().trim().min(1, badgeMessagesCodes.BADGE_NAME_REQUIRED),
    descriptionAr: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
    emoji: z.string().trim().optional(),
    bgColor: hexColor,
    textColor: hexColor,
    score: z.number().int(badgeMessagesCodes.INVALID_SCORE).min(0, badgeMessagesCodes.INVALID_SCORE),
    isActive: z.boolean().optional(),
  });

  static updateBadgeSchema = z.object({
    code: z.string().trim().min(1, badgeMessagesCodes.BADGE_CODE_REQUIRED).optional(),
    nameAr: z.string().trim().min(1, badgeMessagesCodes.BADGE_NAME_REQUIRED).optional(),
    nameEn: z.string().trim().min(1, badgeMessagesCodes.BADGE_NAME_REQUIRED).optional(),
    descriptionAr: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
    emoji: z.string().trim().optional(),
    bgColor: hexColor,
    textColor: hexColor,
    score: z.number().int(badgeMessagesCodes.INVALID_SCORE).min(0, badgeMessagesCodes.INVALID_SCORE).optional(),
    isActive: z.boolean().optional(),
  });

  static awardBadgeSchema = z.object({
    studentId: z
      .number()
      .int()
      .positive(badgeMessagesCodes.STUDENT_REQUIRED),
  });

  static revokeBadgeSchema = z.object({
    studentId: z
      .number()
      .int()
      .positive(badgeMessagesCodes.STUDENT_REQUIRED),
  });
}
