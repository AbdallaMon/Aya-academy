// ===========================================================================
// quiz.repo — Prisma I/O only for the quizzes module. (Reference idiom:
// single object args with optional `client`, each list owns pagination and
// returns { items, total, page, pageSize }.)
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { activeSubscriptionWhere } from "@aya/shared";
import { paginate } from "../../shared/utility/pagination.js";
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
  listCategories({ client } = {}) {
    return (client ?? prisma).questionCategory.findMany({
      orderBy: { nameAr: "asc" },
      select: categorySelect,
    });
  }

  getCategoryById({ id, client } = {}) {
    return (client ?? prisma).questionCategory.findUnique({
      where: { id },
      select: categorySelect,
    });
  }

  createCategory({ data, client } = {}) {
    return (client ?? prisma).questionCategory.create({
      data,
      select: categorySelect,
    });
  }

  updateCategory({ id, data, client } = {}) {
    return (client ?? prisma).questionCategory.update({
      where: { id },
      data,
      select: categorySelect,
    });
  }

  deleteCategory({ id, client } = {}) {
    return (client ?? prisma).questionCategory.delete({
      where: { id },
      select: { id: true },
    });
  }

  countQuestionsInCategory({ categoryId, client } = {}) {
    return (client ?? prisma).quizQuestion.count({ where: { categoryId } });
  }

  // ════════════════════════════════════════════════════════
  // BANK
  // ════════════════════════════════════════════════════════
  async listBankQuestions({ where, page, limit, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    const [items, total] = await Promise.all([
      db.quizQuestion.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: bankQuestionSelect,
      }),
      db.quizQuestion.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getBankQuestionById({ id, client } = {}) {
    return (client ?? prisma).quizQuestion.findUnique({
      where: { id },
      select: bankQuestionSelect,
    });
  }

  /** Active bank questions among the given ids (used when validating invites). */
  findActiveBankQuestionIds({ ids, client } = {}) {
    return (client ?? prisma).quizQuestion.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true },
    });
  }

  createBankQuestion({ categoryId, textAr, textEn, isActive, createdById, options, client } = {}) {
    return (client ?? prisma).quizQuestion.create({
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

  updateBankQuestion({ id, data, options, client } = {}) {
    const run = (tx) =>
      (async () => {
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
      })();
    return client ? run(client) : prisma.$transaction(run);
  }

  deactivateBankQuestion({ id, client } = {}) {
    return (client ?? prisma).quizQuestion.update({
      where: { id },
      data: { isActive: false },
      select: bankQuestionSelect,
    });
  }

  // ════════════════════════════════════════════════════════
  // INVITES
  // ════════════════════════════════════════════════════════
  async listInvites({ where, page, limit, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    const [items, total] = await Promise.all([
      db.quizInvite.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: inviteListSelect,
      }),
      db.quizInvite.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getInviteByToken({ token, client } = {}) {
    return (client ?? prisma).quizInvite.findUnique({
      where: { token },
      select: inviteListSelect,
    });
  }

  /** Raw invite row + its exposed question ids (no projection) for build flow. */
  getInviteWithQuestionIdsByToken({ token, client } = {}) {
    return (client ?? prisma).quizInvite.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        parentId: true,
        status: true,
        expiresAt: true,
        badgeId: true,
        questions: { select: { questionId: true } },
        quiz: { select: { id: true } },
      },
    });
  }

  /** Exposed (selected) bank questions for an invite, with options. */
  getExposedQuestionsForInvite({ inviteId, client } = {}) {
    return (client ?? prisma).quizQuestion.findMany({
      where: { inviteLinks: { some: { inviteId } } },
      orderBy: { id: "asc" },
      select: exposedQuestionSelect,
    });
  }

  createInvite({ token, parentId, createdById, expiresAt, questionIds, badgeId, client } = {}) {
    return (client ?? prisma).quizInvite.create({
      data: {
        token,
        parentId,
        createdById,
        expiresAt: expiresAt ?? null,
        badgeId: badgeId ?? null,
        questions: {
          create: questionIds.map((questionId) => ({ questionId })),
        },
      },
      select: inviteListSelect,
    });
  }

  updateInviteStatus({ id, status, client } = {}) {
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
  getBankQuestionsForSnapshot({ ids, client } = {}) {
    return (client ?? prisma).quizQuestion.findMany({
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
  buildQuiz({ invite, quizData, items, participantStudentIds, builtStatus, client } = {}) {
    const run = (tx) =>
      (async () => {
        const quiz = await tx.quiz.create({
          data: {
            inviteId: invite.id,
            title: quizData.title,
            createdByParentId: invite.parentId,
            passThreshold: quizData.passThreshold,
            giftName: quizData.giftName ?? null,
            giftThemeJson: quizData.giftThemeJson ?? undefined,
            badgeId: quizData.badgeId ?? null,
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
      })();
    return client ? run(client) : prisma.$transaction(run);
  }

  // ════════════════════════════════════════════════════════
  // QUIZ READ
  // ════════════════════════════════════════════════════════
  async listQuizzes({ where, page, limit, select, orderBy, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    const [items, total] = await Promise.all([
      db.quiz.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: "desc" },
        select: select ?? quizListSelect(),
      }),
      db.quiz.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  /**
   * Quiz ids (optionally scoped to one parent) where EVERY assigned participant
   * has at least one attempt — i.e. the quiz is fully completed. Used for the
   * admin/parent "done" filter, which a plain Prisma `where` can't express
   * (it needs a per-row participants-vs-attempts count comparison).
   */
  async getFullyCompletedQuizIds({ parentId, client } = {}) {
    const db = client ?? prisma;
    const rows = parentId
      ? await db.$queryRaw`
          SELECT q.id AS id
          FROM \`Quiz\` q
          JOIN \`QuizParticipant\` p ON p.quizId = q.id
          LEFT JOIN \`QuizAttempt\` a ON a.quizId = q.id AND a.studentId = p.studentId
          WHERE q.createdByParentId = ${parentId}
          GROUP BY q.id
          HAVING COUNT(DISTINCT p.studentId) = COUNT(DISTINCT a.studentId)`
      : await db.$queryRaw`
          SELECT q.id AS id
          FROM \`Quiz\` q
          JOIN \`QuizParticipant\` p ON p.quizId = q.id
          LEFT JOIN \`QuizAttempt\` a ON a.quizId = q.id AND a.studentId = p.studentId
          GROUP BY q.id
          HAVING COUNT(DISTINCT p.studentId) = COUNT(DISTINCT a.studentId)`;
    return rows.map((r) => Number(r.id));
  }

  getQuizById({ id, client } = {}) {
    return (client ?? prisma).quiz.findUnique({
      where: { id },
      select: quizDetailSelect,
    });
  }

  /** Bare quiz (scope fields + grading inputs) without heavy projection. */
  getQuizForGrading({ id, client } = {}) {
    return (client ?? prisma).quiz.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        passThreshold: true,
        giftName: true,
        giftThemeJson: true,
        createdByParentId: true,
        badgeId: true,
        items: { select: quizItemSelect, orderBy: { order: "asc" } },
      },
    });
  }

  isParticipant({ quizId, studentId, client } = {}) {
    return (client ?? prisma).quizParticipant
      .findUnique({
        where: { quizId_studentId: { quizId, studentId } },
        select: { id: true },
      })
      .then(Boolean);
  }

  async getParticipantStudentIds({ quizId, client } = {}) {
    const rows = await (client ?? prisma).quizParticipant.findMany({
      where: { quizId },
      select: { studentId: true },
    });
    return rows.map((r) => r.studentId);
  }

  // ════════════════════════════════════════════════════════
  // ATTEMPTS
  // ════════════════════════════════════════════════════════
  createAttempt({ data, client } = {}) {
    return (client ?? prisma).quizAttempt.create({
      data,
      select: attemptSelect,
    });
  }

  /** Increment a student's points (used inside the attempt transaction). */
  incrementStudentPoints({ studentId, points, client } = {}) {
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
  getUserRole({ id, client } = {}) {
    return (client ?? prisma).user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
  }

  /** studentIds linked to this parent (subset of the input). */
  async getLinkedStudentIds({ parentId, studentIds, client } = {}) {
    const links = await (client ?? prisma).parentStudent.findMany({
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
  async getActiveSubscribedStudentIds({ parentId, studentIds, client } = {}) {
    if (!studentIds?.length) return [];
    const linkedIds = await this.getLinkedStudentIds({
      parentId,
      studentIds,
      client,
    });
    if (!linkedIds.length) return [];

    const subs = await (client ?? prisma).subscription.findMany({
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
export { QuizRepo };
