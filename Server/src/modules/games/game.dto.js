// Output projections for the games module.

// Thin list projection — safe for public landing + authenticated lists.
export const gameListSelect = {
  id: true,
  slug: true,
  titleAr: true,
  titleEn: true,
  descriptionAr: true,
  descriptionEn: true,
  type: true,
  isPublic: true,
  isActive: true,
  isFree: true,
  passThreshold: true,
  coverImageId: true,
  createdAt: true,
};

// Full projection — list fields + config + ordered questions/options.
// NOTE: includes GameOption.isCorrect (needed for grading/admin). The usecase
// MUST strip answers per audience via stripAnswers() before returning to kids.
export const gameFullSelect = {
  ...gameListSelect,
  configJson: true,
  questions: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      gameId: true,
      order: true,
      kind: true,
      promptAr: true,
      promptEn: true,
      mediaJson: true,
      options: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          questionId: true,
          order: true,
          labelAr: true,
          labelEn: true,
          emoji: true,
          isCorrect: true,
          feedbackAr: true,
          feedbackEn: true,
        },
      },
    },
  },
};
