import { z } from "zod";
import { QUIZ_ITEM_SOURCES, quizMessagesCodes } from "@ayah/shared";

// Reusable option schema (bank questions + custom quiz items share this shape).
const optionSchema = z.object({
  labelAr: z.string().min(1, quizMessagesCodes.QUESTION_OPTION_LABEL_REQUIRED),
  labelEn: z.string().min(1, quizMessagesCodes.QUESTION_OPTION_LABEL_REQUIRED),
  isCorrect: z.boolean().optional().default(false),
  order: z.number().int().optional(),
});

// >=2 options AND >=1 correct.
function refineOptions(options, ctx, minCode, correctCode) {
  if (!options || options.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: minCode });
    return;
  }
  if (!options.some((o) => o.isCorrect)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: correctCode });
  }
}

const positiveInt = z.number().int().positive();

export class QuizValidation {
  // ── categories ──────────────────────────────────────────
  static createCategorySchema = z.object({
    nameAr: z.string().min(1, quizMessagesCodes.CATEGORY_NAME_REQUIRED),
    nameEn: z.string().min(1, quizMessagesCodes.CATEGORY_NAME_REQUIRED),
  });

  static updateCategorySchema = z.object({
    nameAr: z.string().min(1, quizMessagesCodes.CATEGORY_NAME_REQUIRED).optional(),
    nameEn: z.string().min(1, quizMessagesCodes.CATEGORY_NAME_REQUIRED).optional(),
  });

  // ── bank questions ──────────────────────────────────────
  static createBankQuestionSchema = z.object({
    categoryId: positiveInt.optional(),
    textAr: z.string().min(1, quizMessagesCodes.QUESTION_TEXT_REQUIRED),
    textEn: z.string().min(1, quizMessagesCodes.QUESTION_TEXT_REQUIRED),
    isActive: z.boolean().optional(),
    options: z
      .array(optionSchema)
      .superRefine((options, ctx) =>
        refineOptions(
          options,
          ctx,
          quizMessagesCodes.QUESTION_OPTIONS_MIN,
          quizMessagesCodes.QUESTION_NEEDS_CORRECT_OPTION,
        ),
      ),
  });

  static updateBankQuestionSchema = z.object({
    categoryId: positiveInt.nullable().optional(),
    textAr: z.string().min(1, quizMessagesCodes.QUESTION_TEXT_REQUIRED).optional(),
    textEn: z.string().min(1, quizMessagesCodes.QUESTION_TEXT_REQUIRED).optional(),
    isActive: z.boolean().optional(),
    // If provided, options fully replace the existing set → still must be valid.
    options: z
      .array(optionSchema)
      .superRefine((options, ctx) =>
        refineOptions(
          options,
          ctx,
          quizMessagesCodes.QUESTION_OPTIONS_MIN,
          quizMessagesCodes.QUESTION_NEEDS_CORRECT_OPTION,
        ),
      )
      .optional(),
  });

  // ── invites ─────────────────────────────────────────────
  static createInviteSchema = z.object({
    parentId: positiveInt.refine((v) => v !== undefined, {
      message: quizMessagesCodes.INVITE_PARENT_REQUIRED,
    }),
    questionIds: z
      .array(positiveInt)
      .min(1, quizMessagesCodes.INVITE_QUESTIONS_REQUIRED),
    expiresAt: z.coerce.date().optional(),
    // Optional badge granted to the student when they pass the built quiz.
    badgeId: positiveInt.optional(),
  });

  // ── quiz build ──────────────────────────────────────────
  static buildQuizSchema = z.object({
    title: z.string().min(1, quizMessagesCodes.QUIZ_TITLE_REQUIRED),
    // Percentage (1–100) of correct answers required to pass.
    passThreshold: z
      .number()
      .int()
      .min(1, quizMessagesCodes.QUIZ_PASS_THRESHOLD_INVALID)
      .max(100, quizMessagesCodes.QUIZ_PASS_THRESHOLD_INVALID),
    giftName: z.string().trim().optional(),
    giftThemeJson: z.any().optional(),
    items: z
      .array(
        z.discriminatedUnion("source", [
          z.object({
            source: z.literal(QUIZ_ITEM_SOURCES.BANK),
            sourceQuestionId: positiveInt,
          }),
          z.object({
            source: z.literal(QUIZ_ITEM_SOURCES.CUSTOM),
            textAr: z.string().min(1, quizMessagesCodes.QUESTION_TEXT_REQUIRED),
            textEn: z.string().min(1, quizMessagesCodes.QUESTION_TEXT_REQUIRED),
            options: z
              .array(optionSchema)
              .superRefine((options, ctx) =>
                refineOptions(
                  options,
                  ctx,
                  quizMessagesCodes.QUIZ_ITEM_OPTIONS_MIN,
                  quizMessagesCodes.QUIZ_ITEM_NEEDS_CORRECT_OPTION,
                ),
              ),
          }),
        ]),
      )
      .min(1, quizMessagesCodes.QUIZ_ITEMS_REQUIRED),
    participantStudentIds: z
      .array(positiveInt)
      .min(1, quizMessagesCodes.QUIZ_PARTICIPANTS_REQUIRED),
  });

  // ── attempt ─────────────────────────────────────────────
  static attemptSchema = z.object({
    answersJson: z.any().optional(),
    answers: z
      .array(
        z.object({
          itemId: positiveInt,
          optionId: positiveInt,
        }),
      )
      .min(1, quizMessagesCodes.QUIZ_ANSWERS_REQUIRED),
  });
}
