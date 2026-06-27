import {
  CERTIFICATE_TEMPLATE_KEYS,
  NOTIFICATION_TYPES,
  QUIZ_INVITE_STATUSES,
  QUIZ_ITEM_SOURCES,
  USER_ROLES,
  messagesNames,
} from "@aya/shared";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@aya/db/prisma.client.js";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../shared/errors/AppError.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import {
  buildSearchQuery,
  parseBooleanFilter,
} from "../../shared/utility/helper.js";
import { notificationUsecase } from "../notifications/notification.usecase.js";
import { certificateUsecase } from "../certificates/certificate.usecase.js";
import { rewardUsecase } from "../rewards/reward.usecase.js";
import { quizRepo } from "./quiz.repo.js";
import { quizMessagesCodes } from "./quiz.messages.js";
import { quizListSelect, stripAnswers } from "./quiz.dto.js";

// Points awarded per attempt: 5 per correct answer, +30 bonus on pass.
const POINTS_PER_CORRECT = 5;
const PASS_BONUS_POINTS = 30;

class QuizUsecase {
  // ════════════════════════════════════════════════════════
  // CATEGORIES (admin)
  // ════════════════════════════════════════════════════════
  async listCategories() {
    return quizRepo.listCategories();
  }

  async getCategoryOrThrow(id) {
    const category = await quizRepo.getCategoryById(id);
    if (!category) throw notFound(quizMessagesCodes.CATEGORY_NOT_FOUND);
    return category;
  }

  async createCategory(authUser, input) {
    return quizRepo.createCategory({
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      createdById: authUser.id,
    });
  }

  async updateCategory(id, input) {
    await this.getCategoryOrThrow(id);
    return quizRepo.updateCategory(id, {
      nameAr: input.nameAr,
      nameEn: input.nameEn,
    });
  }

  async removeCategory(id) {
    await this.getCategoryOrThrow(id);
    const questionCount = await quizRepo.countQuestionsInCategory(id);
    if (questionCount > 0) {
      throw conflict(
        quizMessagesCodes.CATEGORY_HAS_QUESTIONS,
        messagesNames.quizMessages,
      );
    }
    return quizRepo.deleteCategory(id);
  }

  // ════════════════════════════════════════════════════════
  // BANK (admin)
  // ════════════════════════════════════════════════════════
  buildBankWhere({ search, categoryId, isActive }) {
    const where = {};
    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["textAr", "textEn"],
    });
    if (or) where.OR = or;
    if (categoryId) where.categoryId = categoryId;
    const active = parseBooleanFilter(isActive);
    if (active !== undefined) where.isActive = active;
    return where;
  }

  async listBank(params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = this.buildBankWhere(params);
    const { items, total } = await quizRepo.listBankQuestions(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }

  async getBankQuestion(id) {
    const question = await quizRepo.getBankQuestionById(id);
    if (!question) throw notFound(quizMessagesCodes.QUESTION_NOT_FOUND);
    return question;
  }

  async createBankQuestion(authUser, input) {
    if (input.categoryId) await this.getCategoryOrThrow(input.categoryId);
    return quizRepo.createBankQuestion({
      categoryId: input.categoryId,
      textAr: input.textAr,
      textEn: input.textEn,
      isActive: input.isActive,
      createdById: authUser.id,
      options: input.options,
    });
  }

  async updateBankQuestion(id, input) {
    await this.getBankQuestion(id);
    if (input.categoryId) await this.getCategoryOrThrow(input.categoryId);

    const data = {
      textAr: input.textAr,
      textEn: input.textEn,
      isActive: input.isActive,
    };
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;

    return quizRepo.updateBankQuestion(id, { data, options: input.options });
  }

  async removeBankQuestion(id) {
    await this.getBankQuestion(id);
    return quizRepo.deactivateBankQuestion(id);
  }

  // ════════════════════════════════════════════════════════
  // INVITES
  // ════════════════════════════════════════════════════════
  async createInvite(authUser, input) {
    // Validate the target is an existing PARENT.
    const parent = await quizRepo.getUserRole(input.parentId);
    if (!parent || parent.role !== USER_ROLES.PARENT) {
      throw badRequest(
        quizMessagesCodes.INVITE_PARENT_INVALID,
        messagesNames.quizMessages,
      );
    }

    // Validate every questionId belongs to the bank AND is active.
    const activeRows = await quizRepo.findActiveBankQuestionIds(
      input.questionIds,
    );
    const activeIds = new Set(activeRows.map((r) => r.id));
    if (input.questionIds.some((id) => !activeIds.has(id))) {
      throw badRequest(
        quizMessagesCodes.INVITE_QUESTIONS_INVALID,
        messagesNames.quizMessages,
      );
    }

    const token = uuidv4();
    const invite = await quizRepo.createInvite({
      token,
      parentId: input.parentId,
      createdById: authUser.id,
      expiresAt: input.expiresAt,
      questionIds: [...new Set(input.questionIds)],
    });

    // Best-effort notify the parent that a quiz invite is ready.
    try {
      await notificationUsecase.createNotification({
        userId: input.parentId,
        type: NOTIFICATION_TYPES.QUIZ_INVITE,
        titleAr: "دعوة لإنشاء اختبار",
        titleEn: "Quiz invite",
        link: `/quizzes/build/${token}`,
        dataJson: { token },
      });
    } catch {
      // swallow — notification is best-effort
    }

    return invite;
  }

  buildInviteListWhere(authUser) {
    if (authUser.role === USER_ROLES.ADMIN) return {};
    // PARENT sees only invites addressed to them.
    return { parentId: authUser.id };
  }

  async listInvites(authUser, params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = this.buildInviteListWhere(authUser);
    const { items, total } = await quizRepo.listInvites(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }

  /** Scope: ADMIN or the invite's parent only. */
  assertCanAccessInvite(authUser, invite) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.role === USER_ROLES.PARENT && invite.parentId === authUser.id) {
      return;
    }
    throw forbidden(quizMessagesCodes.CANNOT_ACCESS_INVITE);
  }

  async getInviteByToken(authUser, token) {
    const invite = await quizRepo.getInviteByToken(token);
    if (!invite) throw notFound(quizMessagesCodes.INVITE_NOT_FOUND);
    this.assertCanAccessInvite(authUser, invite);

    const questions = await quizRepo.getExposedQuestionsForInvite(invite.id);

    // Best-effort: PENDING → OPENED on first open.
    if (invite.status === QUIZ_INVITE_STATUSES.PENDING) {
      try {
        await quizRepo.updateInviteStatus(
          invite.id,
          QUIZ_INVITE_STATUSES.OPENED,
        );
        invite.status = QUIZ_INVITE_STATUSES.OPENED;
      } catch {
        // swallow — status bump is best-effort
      }
    }

    return { ...invite, questions };
  }

  // ════════════════════════════════════════════════════════
  // QUIZ BUILD (parent)
  // ════════════════════════════════════════════════════════
  async buildQuiz(authUser, token, input) {
    const invite = await quizRepo.getInviteWithQuestionIdsByToken(token);
    if (!invite) throw notFound(quizMessagesCodes.INVITE_NOT_FOUND);

    // Scope: invite must belong to this parent.
    if (authUser.role !== USER_ROLES.PARENT || invite.parentId !== authUser.id) {
      throw forbidden(quizMessagesCodes.CANNOT_ACCESS_INVITE);
    }

    // Transition guard: cannot build a COMPLETED/EXPIRED invite.
    if (invite.status === QUIZ_INVITE_STATUSES.EXPIRED) {
      throw badRequest(
        quizMessagesCodes.INVITE_EXPIRED,
        messagesNames.quizMessages,
      );
    }
    if (
      invite.status === QUIZ_INVITE_STATUSES.COMPLETED ||
      invite.status === QUIZ_INVITE_STATUSES.BUILT ||
      invite.quiz
    ) {
      throw conflict(
        quizMessagesCodes.INVITE_ALREADY_BUILT,
        messagesNames.quizMessages,
      );
    }
    // Honour an expiry date even if status wasn't swept yet.
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      throw badRequest(
        quizMessagesCodes.INVITE_EXPIRED,
        messagesNames.quizMessages,
      );
    }

    const exposedIds = new Set(invite.questions.map((q) => q.questionId));

    // Split + validate items by source.
    const bankSourceIds = [];
    for (const item of input.items) {
      if (item.source === QUIZ_ITEM_SOURCES.BANK) {
        if (!exposedIds.has(item.sourceQuestionId)) {
          throw badRequest(
            quizMessagesCodes.QUIZ_ITEM_NOT_EXPOSED,
            messagesNames.quizMessages,
          );
        }
        bankSourceIds.push(item.sourceQuestionId);
      }
    }

    // Snapshot bank questions (text + options) for cloning.
    const snapshots = bankSourceIds.length
      ? await quizRepo.getBankQuestionsForSnapshot([...new Set(bankSourceIds)])
      : [];
    const snapshotById = new Map(snapshots.map((q) => [q.id, q]));

    const items = input.items.map((item) => {
      if (item.source === QUIZ_ITEM_SOURCES.BANK) {
        const snap = snapshotById.get(item.sourceQuestionId);
        // Should always exist — guarded above — but be defensive.
        if (!snap) {
          throw badRequest(
            quizMessagesCodes.QUIZ_ITEM_NOT_EXPOSED,
            messagesNames.quizMessages,
          );
        }
        return {
          source: QUIZ_ITEM_SOURCES.BANK,
          sourceQuestionId: snap.id,
          textAr: snap.textAr,
          textEn: snap.textEn,
          options: snap.options.map((o) => ({
            labelAr: o.labelAr,
            labelEn: o.labelEn,
            isCorrect: o.isCorrect,
            order: o.order,
          })),
        };
      }
      // CUSTOM (already validated >=2 options & >=1 correct by Zod).
      return {
        source: QUIZ_ITEM_SOURCES.CUSTOM,
        sourceQuestionId: null,
        textAr: item.textAr,
        textEn: item.textEn,
        options: item.options.map((o, index) => ({
          labelAr: o.labelAr,
          labelEn: o.labelEn,
          isCorrect: o.isCorrect ?? false,
          order: o.order ?? index,
        })),
      };
    });

    // Participants: must be linked students of this parent AND active-subscribed.
    const uniqueParticipantIds = [...new Set(input.participantStudentIds)];
    const eligibleIds = await quizRepo.getActiveSubscribedStudentIds(
      authUser.id,
      uniqueParticipantIds,
    );
    const eligibleSet = new Set(eligibleIds);
    if (uniqueParticipantIds.some((id) => !eligibleSet.has(id))) {
      throw badRequest(
        quizMessagesCodes.QUIZ_PARTICIPANTS_INVALID,
        messagesNames.quizMessages,
      );
    }

    const quiz = await quizRepo.buildQuiz({
      invite,
      quizData: {
        title: input.title,
        passThreshold: input.passThreshold,
        giftName: input.giftName,
        giftThemeJson: input.giftThemeJson,
      },
      items,
      participantStudentIds: uniqueParticipantIds,
      builtStatus: QUIZ_INVITE_STATUSES.BUILT,
    });

    // Best-effort: notify each participant student of the new quiz.
    try {
      await notificationUsecase.createManyForUsers(uniqueParticipantIds, {
        type: NOTIFICATION_TYPES.QUIZ_INVITE,
        titleAr: "اختبار جديد في انتظارك",
        titleEn: "A new quiz is waiting for you",
        link: "/dashboard",
        dataJson: { quizId: quiz.id },
      });
    } catch {
      // swallow — notification is best-effort
    }

    return quiz;
  }

  // ════════════════════════════════════════════════════════
  // QUIZ READ
  // ════════════════════════════════════════════════════════
  /** Role scope for the quiz list (which quizzes the viewer may see at all). */
  buildQuizScopeWhere(authUser) {
    if (authUser.role === USER_ROLES.ADMIN) return {};
    if (authUser.role === USER_ROLES.PARENT) {
      return { createdByParentId: authUser.id };
    }
    // STUDENT: quizzes where they are a participant.
    return { participants: { some: { studentId: authUser.id } } };
  }

  /** The child an admin/parent is focusing the list on (the "أطفالي" filter). */
  resolveFocusStudentId(authUser, studentId) {
    if (authUser.role === USER_ROLES.STUDENT) return undefined;
    const id = Number(studentId);
    return Number.isInteger(id) && id > 0 ? id : undefined;
  }

  /**
   * Compose the full list `where`: role scope + title search + an optional
   * per-child ("أطفالي") narrowing + done/pending status filter. `status`
   * semantics depend on whose lens we're using:
   *  - STUDENT, or ADMIN/PARENT focused on ONE child: done = that child has an
   *    attempt; pending = they don't.
   *  - ADMIN/PARENT (no child focus): done = EVERY assigned child completed.
   */
  async buildQuizListWhere(authUser, { search, status, studentId } = {}) {
    const where = this.buildQuizScopeWhere(authUser);
    const ands = [];

    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["title"],
    });
    if (or) ands.push({ OR: or });

    // "أطفالي" filter — narrow to quizzes that include the chosen child.
    const focusStudentId = this.resolveFocusStudentId(authUser, studentId);
    if (focusStudentId) {
      ands.push({ participants: { some: { studentId: focusStudentId } } });
    }

    const normalized =
      typeof status === "string" ? status.toLowerCase() : undefined;
    if (normalized === "done" || normalized === "pending") {
      // A single-child lens (the student themself, or a focused child) checks
      // that one child's attempt; the manager overview checks full completion.
      const lensStudentId =
        authUser.role === USER_ROLES.STUDENT ? authUser.id : focusStudentId;
      if (lensStudentId) {
        ands.push(
          normalized === "done"
            ? { attempts: { some: { studentId: lensStudentId } } }
            : { attempts: { none: { studentId: lensStudentId } } },
        );
      } else {
        const parentId =
          authUser.role === USER_ROLES.PARENT ? authUser.id : null;
        const doneIds = await quizRepo.getFullyCompletedQuizIds(parentId);
        ands.push(
          normalized === "done"
            ? { id: { in: doneIds } }
            : { id: { notIn: doneIds } },
        );
      }
    }

    if (ands.length) where.AND = ands;
    return where;
  }

  /**
   * Single-child status shape (used for a STUDENT viewing their own quizzes, or
   * an ADMIN/PARENT focused on one child). `attempts` here are already scoped to
   * that one child. → PASSED | ATTEMPTED | PENDING + a downloadable certificate.
   */
  shapeSingleChildRow(row) {
    const attempts = row.attempts ?? [];
    const passedAttempt = attempts.find((a) => a.passed);
    const status = passedAttempt
      ? "PASSED"
      : attempts.length
        ? "ATTEMPTED"
        : "PENDING";
    const certificateId =
      (passedAttempt ?? attempts.find((a) => a.certificate))?.certificate?.id ??
      null;
    return {
      ...row,
      myAttempt: attempts[0] ?? null,
      passed: Boolean(passedAttempt),
      certificateId,
      status,
    };
  }

  /** Attach per-viewer status fields to each quiz list row. */
  shapeQuizListRow(row, authUser, focusStudentId) {
    // STUDENT, or a manager focused on a single child → per-child status.
    if (authUser.role === USER_ROLES.STUDENT || focusStudentId) {
      return {
        ...this.shapeSingleChildRow(row),
        participantsCount: row._count?.participants ?? 0,
        focusStudentId: focusStudentId ?? undefined,
      };
    }

    // ADMIN / PARENT overview: completion across all assigned children.
    const attempts = row.attempts ?? [];
    const participantsCount = row._count?.participants ?? 0;
    const completedCount = new Set(attempts.map((a) => a.studentId)).size;
    const status =
      participantsCount > 0 && completedCount >= participantsCount
        ? "DONE"
        : completedCount > 0
          ? "PARTIAL"
          : "PENDING";
    return { ...row, participantsCount, completedCount, status };
  }

  async listQuizzes(authUser, params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = await this.buildQuizListWhere(authUser, params);
    const focusStudentId = this.resolveFocusStudentId(authUser, params.studentId);
    // Scope the embedded attempts to whichever child we're rendering for.
    const attemptStudentId =
      authUser.role === USER_ROLES.STUDENT ? authUser.id : focusStudentId;
    const select = attemptStudentId
      ? quizListSelect({ studentId: attemptStudentId })
      : quizListSelect();
    const { items, total } = await quizRepo.listQuizzes(where, skip, take, {
      select,
    });
    const shaped = items.map((row) =>
      this.shapeQuizListRow(row, authUser, focusStudentId),
    );
    return paginatedResult(shaped, total, page, limit);
  }

  /** Scope: ADMIN, owning parent, or a participant student. */
  async assertCanAccessQuiz(authUser, quiz) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (
      authUser.role === USER_ROLES.PARENT &&
      quiz.createdByParentId === authUser.id
    ) {
      return;
    }
    if (authUser.role === USER_ROLES.STUDENT) {
      const isParticipant = (quiz.participants ?? []).some(
        (p) => p.studentId === authUser.id,
      );
      if (isParticipant) return;
    }
    throw forbidden(quizMessagesCodes.CANNOT_ACCESS_QUIZ);
  }

  async getQuizById(authUser, id) {
    const quiz = await quizRepo.getQuizById(id);
    if (!quiz) throw notFound(quizMessagesCodes.QUIZ_NOT_FOUND);
    await this.assertCanAccessQuiz(authUser, quiz);

    // Students never see the answer key.
    if (authUser.role === USER_ROLES.STUDENT) return stripAnswers(quiz);
    return quiz;
  }

  // ════════════════════════════════════════════════════════
  // ATTEMPTS (student)
  // ════════════════════════════════════════════════════════
  /** Grade chosen options against each item's correct option. */
  grade(items, answers) {
    const answerByItem = new Map(answers.map((a) => [a.itemId, a.optionId]));
    let correctCount = 0;
    for (const item of items) {
      const chosenOptionId = answerByItem.get(item.id);
      if (chosenOptionId === undefined) continue;
      const chosen = item.options.find((o) => o.id === chosenOptionId);
      if (chosen?.isCorrect) correctCount += 1;
    }
    return { correctCount, totalQuestions: items.length };
  }

  async attempt(authUser, quizId, input) {
    const quiz = await quizRepo.getQuizForGrading(quizId);
    if (!quiz) throw notFound(quizMessagesCodes.QUIZ_NOT_FOUND);

    // Scope: only a participant student may attempt.
    const isParticipant = await quizRepo.isParticipant(quizId, authUser.id);
    if (!isParticipant) {
      throw forbidden(quizMessagesCodes.QUIZ_NOT_PARTICIPANT);
    }

    const { correctCount, totalQuestions } = this.grade(quiz.items, input.answers);
    // `passThreshold` is a PERCENTAGE (0–100), matching the build UI. Pass when
    // the child's correct-answer percentage meets it.
    const scorePercent =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const passed = scorePercent >= quiz.passThreshold;
    const points = correctCount * POINTS_PER_CORRECT + (passed ? PASS_BONUS_POINTS : 0);

    // Atomic: record the attempt + bump the student's points.
    const attempt = await prisma.$transaction(async (tx) => {
      const created = await quizRepo.createAttempt(
        {
          quizId,
          studentId: authUser.id,
          score: correctCount,
          correctCount,
          totalQuestions,
          passed,
          answersJson: input.answersJson ?? undefined,
          completedAt: new Date(),
        },
        tx,
      );
      await quizRepo.incrementStudentPoints(authUser.id, points, tx);
      return created;
    });

    let certificate = null;
    if (passed) {
      // Certificate issuance is part of the success payload (not best-effort).
      certificate = await certificateUsecase.issueForQuizAttempt({
        studentId: authUser.id,
        studentName: authUser.name,
        quizAttemptId: attempt.id,
        titleAr: quiz.title,
        titleEn: quiz.title,
        // Unified exam-pass template, shared by all quiz certificates.
        templateKey: CERTIFICATE_TEMPLATE_KEYS.EXAM,
        themeJson: quiz.giftThemeJson,
      });

      // Best-effort: badge + pass/gift notifications.
      try {
        await rewardUsecase.grantBadge({
          userId: authUser.id,
          sourceType: "QUIZ",
          sourceId: quiz.id,
        });
      } catch {
        // swallow — badge is best-effort
      }
      try {
        await notificationUsecase.createNotification({
          userId: authUser.id,
          type: NOTIFICATION_TYPES.QUIZ_PASSED,
          titleAr: "مبروك! لقد نجحت في الاختبار",
          titleEn: "Congratulations! You passed the quiz",
          link: "/dashboard",
          dataJson: { quizId: quiz.id, quizAttemptId: attempt.id },
        });
      } catch {
        // swallow
      }
      if (quiz.giftName) {
        try {
          await notificationUsecase.createNotification({
            userId: authUser.id,
            type: NOTIFICATION_TYPES.GIFT_RECEIVED,
            titleAr: "لقد حصلت على هدية",
            titleEn: "You received a gift",
            link: "/dashboard",
            dataJson: {
              giftName: quiz.giftName,
              giftThemeJson: quiz.giftThemeJson ?? null,
            },
          });
        } catch {
          // swallow
        }
      }
    } else {
      // Best-effort: gentle "try again" notification.
      try {
        await notificationUsecase.createNotification({
          userId: authUser.id,
          type: NOTIFICATION_TYPES.QUIZ_FAILED,
          titleAr: "حاول مرة أخرى، أنت قريب من النجاح",
          titleEn: "Keep trying — you're getting close",
          link: "/dashboard",
          dataJson: { quizId: quiz.id, quizAttemptId: attempt.id },
        });
      } catch {
        // swallow
      }
    }

    return { attempt, passed, certificate };
  }
}

export const quizUsecase = new QuizUsecase();
