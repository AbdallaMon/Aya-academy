import { prisma } from "@aya/db/prisma.client.js";
import { activeSubscriptionWhere } from "@aya/shared";
import {
  attemptSelect,
  bankQuestionSelect,
  categorySelect,
  exposedQuestionSelect,
  inviteListSelect,
  quizDetailSelect,
  quizItemSelect,
  quizListSelect,
} from "./quiz.dto.js";

class QuizRepo {
  // ════════════════════════════════════════════════════════
  // CATEGORIES
  // ════════════════════════════════════════════════════════
  listCategories() {
    return prisma.questionCategory.findMany({
      orderBy: { nameAr: "asc" },
      select: categorySelect,
    });
  }

  getCategoryById(id) {
    return prisma.questionCategory.findUnique({
      where: { id },
      select: categorySelect,
    });
  }

  createCategory(data) {
    return prisma.questionCategory.create({ data, select: categorySelect });
  }

  updateCategory(id, data) {
    return prisma.questionCategory.update({
      where: { id },
      data,
      select: categorySelect,
    });
  }

  deleteCategory(id) {
    return prisma.questionCategory.delete({
      where: { id },
      select: { id: true },
    });
  }

  countQuestionsInCategory(categoryId) {
    return prisma.quizQuestion.count({ where: { categoryId } });
  }

  // ════════════════════════════════════════════════════════
  // BANK
  // ════════════════════════════════════════════════════════
  async listBankQuestions(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.quizQuestion.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: bankQuestionSelect,
      }),
      prisma.quizQuestion.count({ where }),
    ]);
    return { items, total };
  }

  getBankQuestionById(id) {
    return prisma.quizQuestion.findUnique({
      where: { id },
      select: bankQuestionSelect,
    });
  }

  /** Active bank questions among the given ids (used when validating invites). */
  findActiveBankQuestionIds(ids) {
    return prisma.quizQuestion.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true },
    });
  }

  createBankQuestion({ categoryId, textAr, textEn, isActive, createdById, options }) {
    return prisma.quizQuestion.create({
      data: {
        categoryId: categoryId ?? null,
        textAr,
        textEn,
        isActive: isActive ?? true,
        createdById,
        options: {
          create: options.map((o, index) => ({
            labelAr: o.labelAr,
            labelEn: o.labelEn,
            isCorrect: o.isCorrect ?? false,
            order: o.order ?? index,
          })),
        },
      },
      select: bankQuestionSelect,
    });
  }

  updateBankQuestion(id, { data, options }) {
    return prisma.$transaction(async (tx) => {
      await tx.quizQuestion.update({ where: { id }, data });
      if (options !== undefined) {
        await tx.quizQuestionOption.deleteMany({ where: { questionId: id } });
        await tx.quizQuestionOption.createMany({
          data: options.map((o, index) => ({
            questionId: id,
            labelAr: o.labelAr,
            labelEn: o.labelEn,
            isCorrect: o.isCorrect ?? false,
            order: o.order ?? index,
          })),
        });
      }
      return tx.quizQuestion.findUnique({
        where: { id },
        select: bankQuestionSelect,
      });
    });
  }

  deactivateBankQuestion(id) {
    return prisma.quizQuestion.update({
      where: { id },
      data: { isActive: false },
      select: bankQuestionSelect,
    });
  }

  // ════════════════════════════════════════════════════════
  // INVITES
  // ════════════════════════════════════════════════════════
  async listInvites(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.quizInvite.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: inviteListSelect,
      }),
      prisma.quizInvite.count({ where }),
    ]);
    return { items, total };
  }

  getInviteByToken(token) {
    return prisma.quizInvite.findUnique({
      where: { token },
      select: inviteListSelect,
    });
  }

  /** Raw invite row + its exposed question ids (no projection) for build flow. */
  getInviteWithQuestionIdsByToken(token) {
    return prisma.quizInvite.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        parentId: true,
        status: true,
        expiresAt: true,
        questions: { select: { questionId: true } },
        quiz: { select: { id: true } },
      },
    });
  }

  /** Exposed (selected) bank questions for an invite, with options. */
  getExposedQuestionsForInvite(inviteId) {
    return prisma.quizQuestion.findMany({
      where: { inviteLinks: { some: { inviteId } } },
      orderBy: { id: "asc" },
      select: exposedQuestionSelect,
    });
  }

  createInvite({ token, parentId, createdById, expiresAt, questionIds }) {
    return prisma.quizInvite.create({
      data: {
        token,
        parentId,
        createdById,
        expiresAt: expiresAt ?? null,
        questions: {
          create: questionIds.map((questionId) => ({ questionId })),
        },
      },
      select: inviteListSelect,
    });
  }

  updateInviteStatus(id, status, client) {
    return (client ?? prisma).quizInvite.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }

  // ════════════════════════════════════════════════════════
  // QUIZ BUILD
  // ════════════════════════════════════════════════════════
  /** Snapshot bank questions (text + options) for cloning into quiz items. */
  getBankQuestionsForSnapshot(ids) {
    return prisma.quizQuestion.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        textAr: true,
        textEn: true,
        options: {
          orderBy: { order: "asc" },
          select: { labelAr: true, labelEn: true, isCorrect: true, order: true },
        },
      },
    });
  }

  /**
   * Create a Quiz + its snapshotted items/options + participants atomically,
   * then flip the invite status to BUILT. `items` are pre-snapshotted by the
   * usecase (each carries source, sourceQuestionId?, textAr/En + options[]).
   */
  buildQuiz({ invite, quizData, items, participantStudentIds, builtStatus }) {
    return prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          inviteId: invite.id,
          title: quizData.title,
          createdByParentId: invite.parentId,
          passThreshold: quizData.passThreshold,
          giftName: quizData.giftName ?? null,
          giftThemeJson: quizData.giftThemeJson ?? undefined,
        },
        select: { id: true },
      });

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        await tx.quizItem.create({
          data: {
            quizId: quiz.id,
            order: i,
            source: item.source,
            sourceQuestionId: item.sourceQuestionId ?? null,
            textAr: item.textAr,
            textEn: item.textEn,
            options: {
              create: item.options.map((o, index) => ({
                labelAr: o.labelAr,
                labelEn: o.labelEn,
                isCorrect: o.isCorrect ?? false,
                order: o.order ?? index,
              })),
            },
          },
        });
      }

      await tx.quizParticipant.createMany({
        data: participantStudentIds.map((studentId) => ({
          quizId: quiz.id,
          studentId,
        })),
      });

      await tx.quizInvite.update({
        where: { id: invite.id },
        data: { status: builtStatus },
      });

      return tx.quiz.findUnique({
        where: { id: quiz.id },
        select: quizDetailSelect,
      });
    });
  }

  // ════════════════════════════════════════════════════════
  // QUIZ READ
  // ════════════════════════════════════════════════════════
  async listQuizzes(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: quizListSelect,
      }),
      prisma.quiz.count({ where }),
    ]);
    return { items, total };
  }

  getQuizById(id) {
    return prisma.quiz.findUnique({ where: { id }, select: quizDetailSelect });
  }

  /** Bare quiz (scope fields + grading inputs) without heavy projection. */
  getQuizForGrading(id) {
    return prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        passThreshold: true,
        giftName: true,
        giftThemeJson: true,
        createdByParentId: true,
        items: { select: quizItemSelect, orderBy: { order: "asc" } },
      },
    });
  }

  isParticipant(quizId, studentId) {
    return prisma.quizParticipant
      .findUnique({
        where: { quizId_studentId: { quizId, studentId } },
        select: { id: true },
      })
      .then(Boolean);
  }

  async getParticipantStudentIds(quizId) {
    const rows = await prisma.quizParticipant.findMany({
      where: { quizId },
      select: { studentId: true },
    });
    return rows.map((r) => r.studentId);
  }

  // ════════════════════════════════════════════════════════
  // ATTEMPTS
  // ════════════════════════════════════════════════════════
  createAttempt(data, client) {
    return (client ?? prisma).quizAttempt.create({
      data,
      select: attemptSelect,
    });
  }

  /** Increment a student's points (used inside the attempt transaction). */
  incrementStudentPoints(studentId, points, client) {
    return (client ?? prisma).user.update({
      where: { id: studentId },
      data: { points: { increment: points } },
      select: { id: true, points: true },
    });
  }

  // ════════════════════════════════════════════════════════
  // SHARED HELPERS
  // ════════════════════════════════════════════════════════
  /** Confirm a user exists and is a PARENT (for invite creation). */
  getUserRole(id) {
    return prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  }

  /** studentIds linked to this parent (subset of the input). */
  async getLinkedStudentIds(parentId, studentIds) {
    const links = await prisma.parentStudent.findMany({
      where: { parentId, studentId: { in: studentIds } },
      select: { studentId: true },
    });
    return links.map((l) => l.studentId);
  }

  /**
   * Subset of `studentIds` that are (a) linked to this parent AND (b) are
   * currently subscribed. Currently active = status ACTIVE AND now within
   * [startDate, endDate] (see `activeSubscriptionWhere`).
   */
  async getActiveSubscribedStudentIds(parentId, studentIds) {
    if (!studentIds?.length) return [];
    const linkedIds = await this.getLinkedStudentIds(parentId, studentIds);
    if (!linkedIds.length) return [];

    const subs = await prisma.subscription.findMany({
      where: {
        studentId: { in: linkedIds },
        ...activeSubscriptionWhere(),
      },
      select: { studentId: true },
    });
    return [...new Set(subs.map((s) => s.studentId))];
  }
}

export const quizRepo = new QuizRepo();
