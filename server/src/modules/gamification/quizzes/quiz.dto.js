// Prisma `select` projections + output shaping for the quizzes module.
// Pure (no Prisma calls). Keep in sync with quiz.repo.js usage.

// ── categories ────────────────────────────────────────────
export const categorySelect = {
  id: true,
  nameAr: true,
  nameEn: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
};

// ── bank questions ────────────────────────────────────────
export const bankOptionSelect = {
  id: true,
  questionId: true,
  order: true,
  labelAr: true,
  labelEn: true,
  isCorrect: true,
};

// Lightweight category summary embedded in a bank question (admin view only).
export const bankCategorySelect = {
  id: true,
  nameAr: true,
  nameEn: true,
};

export const bankQuestionSelect = {
  id: true,
  categoryId: true,
  textAr: true,
  textEn: true,
  isActive: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  options: { select: bankOptionSelect, orderBy: { order: "asc" } },
  category: { select: bankCategorySelect },
};

// ── invites ───────────────────────────────────────────────
export const inviteListSelect = {
  id: true,
  token: true,
  parentId: true,
  createdById: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  badgeId: true,
  badge: {
    select: {
      id: true,
      code: true,
      nameAr: true,
      nameEn: true,
      emoji: true,
      icon: true,
      bgColor: true,
      textColor: true,
    },
  },
  _count: { select: { questions: true } },
  quiz: { select: { id: true, title: true } },
};

// Exposed bank question shape for the parent building a quiz.
// NOTE: deliberately omits `category` — categories are admin-only and never
// exposed to parents. `isCorrect` IS kept (the parent owns the quiz).
export const exposedQuestionOptionSelect = {
  id: true,
  order: true,
  labelAr: true,
  labelEn: true,
  isCorrect: true,
};

export const exposedQuestionSelect = {
  id: true,
  textAr: true,
  textEn: true,
  options: { select: exposedQuestionOptionSelect, orderBy: { order: "asc" } },
};

// ── quizzes ───────────────────────────────────────────────
// Thin attempt summary embedded in a quiz list row so the client can render
// per-quiz status (done / passed) + a "download certificate" affordance.
export const quizListAttemptSelect = {
  id: true,
  studentId: true,
  score: true,
  correctCount: true,
  totalQuestions: true,
  passed: true,
  completedAt: true,
  student: { select: { id: true, name: true, nickname: true } },
  certificate: { select: { id: true } },
};

/**
 * List projection for a quiz row. The embedded `attempts` are SCOPED to the
 * viewer: a STUDENT sees only their own attempt(s) (pass `studentId`); an
 * ADMIN/PARENT sees every participant's attempt (omit `studentId`).
 */
export function quizListSelect({ studentId } = {}) {
  return {
    id: true,
    inviteId: true,
    title: true,
    createdByParentId: true,
    passThreshold: true,
    giftName: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { items: true, participants: true } },
    attempts: {
      where: studentId ? { studentId } : undefined,
      orderBy: { createdAt: "desc" },
      select: quizListAttemptSelect,
    },
  };
}

export const quizItemOptionSelect = {
  id: true,
  itemId: true,
  order: true,
  labelAr: true,
  labelEn: true,
  isCorrect: true,
};

export const quizItemSelect = {
  id: true,
  quizId: true,
  order: true,
  source: true,
  sourceQuestionId: true,
  textAr: true,
  textEn: true,
  options: { select: quizItemOptionSelect, orderBy: { order: "asc" } },
};

export const quizParticipantStudentSelect = {
  id: true,
  name: true,
  nickname: true,
};

export const quizParticipantSelect = {
  id: true,
  quizId: true,
  studentId: true,
  student: { select: quizParticipantStudentSelect },
};

export const quizDetailSelect = {
  id: true,
  inviteId: true,
  title: true,
  createdByParentId: true,
  passThreshold: true,
  giftName: true,
  giftThemeJson: true,
  createdAt: true,
  updatedAt: true,
  items: { select: quizItemSelect, orderBy: { order: "asc" } },
  participants: { select: quizParticipantSelect },
};

// ── attempts ──────────────────────────────────────────────
export const attemptSelect = {
  id: true,
  quizId: true,
  studentId: true,
  score: true,
  correctCount: true,
  totalQuestions: true,
  passed: true,
  answersJson: true,
  completedAt: true,
  createdAt: true,
};

// ── output shaping ────────────────────────────────────────
/**
 * Remove the `isCorrect` flag from a quiz's item options so a student attempting
 * the quiz never sees the answer key. Returns a new object; does not mutate.
 */
export function stripAnswers(quiz) {
  if (!quiz) return quiz;
  return {
    ...quiz,
    items: (quiz.items ?? []).map((item) => ({
      ...item,
      options: (item.options ?? []).map(({ isCorrect, ...rest }) => rest),
    })),
  };
}
