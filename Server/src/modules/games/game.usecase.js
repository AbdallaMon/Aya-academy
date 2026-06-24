import { prisma } from "@aya/db/prisma.client.js";
import {
  ASSIGNMENT_STATUSES,
  NOTIFICATION_TYPES,
  USER_ROLES,
} from "@aya/shared";
import { badRequest, forbidden, notFound } from "../../shared/errors/AppError.js";
import {
  buildSearchQuery,
  parseBooleanFilter,
} from "../../shared/utility/helper.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { certificateUsecase } from "../certificates/certificate.usecase.js";
import { notificationUsecase } from "../notifications/notification.usecase.js";
import { rewardUsecase } from "../rewards/reward.usecase.js";
import { gameRepo } from "./game.repo.js";
import { gameMessagesCodes } from "./game.messages.js";

// Points awarded per correct answer + a flat bonus for passing.
const POINTS_PER_CORRECT = 5;
const PASS_BONUS = 20;

class GameUsecase {
  /**
   * Remove `isCorrect` from every option (kids must not see the raw answer key),
   * but keep games gradable on the client: derive a non-visual `correctIndices`
   * array onto each question's mediaJson from the stored answer key. The engine
   * grades on `correctIndices` (or falls back to `optionMeta.tone === "good"`),
   * so choice games work without ever shipping the per-option `isCorrect` flag.
   * `correctIndices` is not used for coloring, so quiz-style games don't reveal
   * the answer visually the way tone-coloured games (e.g. phone-manners) do.
   */
  stripAnswers(game) {
    if (!game || !Array.isArray(game.questions)) return game;
    return {
      ...game,
      questions: game.questions.map((question) => {
        const options = question.options ?? [];
        const correctIndices = options
          .map((o, i) => (o.isCorrect ? i : -1))
          .filter((i) => i >= 0);
        const mediaJson = correctIndices.length
          ? { ...(question.mediaJson ?? {}), correctIndices }
          : question.mediaJson;
        return {
          ...question,
          mediaJson,
          options: options.map((option) => {
            const { isCorrect, ...rest } = option;
            return rest;
          }),
        };
      }),
    };
  }

  // ── public (no auth) ────────────────────────────────────
  async listPublic() {
    return gameRepo.listPublic();
  }

  async getPublicBySlug(slug) {
    const game = await gameRepo.getPublicBySlug(slug);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);
    return this.stripAnswers(game);
  }

  // The single public free-trial game (answers stripped, like any public game).
  async getPublicFree() {
    const game = await gameRepo.getPublicFree();
    if (!game) throw notFound(gameMessagesCodes.FREE_GAME_NOT_FOUND);
    return this.stripAnswers(game);
  }

  // ── free-game selection (admin, GAME.MANAGE) ────────────
  // Make ONE game the public free trial. Atomically clears the flag on every
  // other game so exactly one is ever free, and ensures the chosen game is
  // public + active so it actually shows on the marketing /free-game page.
  async setFree(authUser, id) {
    const game = await gameRepo.getById(id);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);

    return prisma.$transaction(async (tx) => {
      await gameRepo.clearAllFreeFlags(tx);
      return gameRepo.markGameFree(game.id, tx);
    });
  }

  // ── authenticated list ──────────────────────────────────
  buildListWhere(authUser, { search, isActive, isPublic, type }) {
    const where = {};

    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["titleAr", "titleEn", "slug"],
    });
    if (or) where.OR = or;

    if (authUser.role === USER_ROLES.ADMIN) {
      const active = parseBooleanFilter(isActive);
      if (active !== undefined) where.isActive = active;

      const isPub = parseBooleanFilter(isPublic);
      if (isPub !== undefined) where.isPublic = isPub;

      if (type && type !== "ALL") where.type = type;
    } else {
      // PARENT / STUDENT only ever see active games (content is global).
      where.isActive = true;
      if (type && type !== "ALL") where.type = type;
    }
    return where;
  }

  async list(authUser, params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = this.buildListWhere(authUser, params);
    const { items, total } = await gameRepo.listGames(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }

  // ── single game (full) ──────────────────────────────────
  async getById(authUser, id) {
    const game = await gameRepo.getById(id);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);

    // ADMIN sees answers; STUDENT/PARENT do not.
    if (authUser.role === USER_ROLES.ADMIN) return game;
    return this.stripAnswers(game);
  }

  /**
   * Authenticated lookup by slug — used inside the dashboard so a student can
   * play ANY active game (not just public ones) without exposing the public
   * route. Non-admins never see active=false games or the answer key.
   */
  async getBySlugAuth(authUser, slug) {
    const game = await gameRepo.getBySlug(slug);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);

    if (authUser.role === USER_ROLES.ADMIN) return game;
    if (!game.isActive) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);
    return this.stripAnswers(game);
  }

  // ── assign (admin-only by permission) ───────────────────
  async assign(authUser, id, input) {
    const game = await gameRepo.getById(id);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);

    const studentIds = [...new Set(input.studentIds)];
    if (studentIds.length === 0) {
      throw badRequest(gameMessagesCodes.STUDENT_IDS_REQUIRED);
    }

    const assignments = await prisma.$transaction((tx) =>
      Promise.all(
        studentIds.map((studentId) =>
          gameRepo.upsertAssignment(
            {
              gameId: game.id,
              studentId,
              assignedById: authUser.id,
              dueAt: input.dueAt,
            },
            tx,
          ),
        ),
      ),
    );

    // Notify the students — best-effort (must not fail the request).
    try {
      await notificationUsecase.createManyForUsers(studentIds, {
        type: NOTIFICATION_TYPES.GAME_ASSIGNED,
        titleAr: "لعبة جديدة في انتظارك!",
        titleEn: "A new game is waiting for you!",
        link: "/dashboard",
        dataJson: { gameId: game.id },
      });
    } catch {
      // swallow — notification is best-effort
    }

    return assignments;
  }

  // ── assignments listing + unassign (admin-only by permission) ───
  async listAssignments(authUser, gameId) {
    const game = await gameRepo.getById(gameId);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);
    return gameRepo.listAssignments(gameId);
  }

  /** The signed-in student's own game assignments (empty for non-students). */
  async myAssignments(authUser) {
    if (authUser.role !== USER_ROLES.STUDENT) return [];
    return gameRepo.listAssignmentsForStudent(authUser.id);
  }

  async unassign(authUser, gameId, studentId) {
    const game = await gameRepo.getById(gameId);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);
    const result = await gameRepo.deleteAssignment(gameId, studentId);
    if (!result || result.count === 0) {
      throw notFound(gameMessagesCodes.ASSIGNMENT_NOT_FOUND);
    }
    return { gameId, studentId, removed: result.count };
  }

  // ── attempt (student-only by permission) ────────────────
  async attempt(authUser, id, input) {
    if (authUser.role !== USER_ROLES.STUDENT) {
      throw forbidden(gameMessagesCodes.ONLY_STUDENT_CAN_ATTEMPT);
    }

    const game = await gameRepo.getById(id);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);
    if (!game.isActive) throw badRequest(gameMessagesCodes.GAME_NOT_ACTIVE);

    const correctCount = input.correctCount;
    const totalQuestions = input.totalQuestions;
    const passed =
      game.passThreshold == null ? true : correctCount >= game.passThreshold;
    const score = correctCount;

    const existingAssignment = await gameRepo.getAssignment(game.id, authUser.id);

    // Core writes are atomic: attempt + points + assignment-status + certificate.
    const { attempt, certificate } = await prisma.$transaction(async (tx) => {
      const createdAttempt = await gameRepo.createAttempt(
        {
          gameId: game.id,
          studentId: authUser.id,
          score,
          correctCount,
          totalQuestions,
          passed,
          answersJson: input.answersJson ?? undefined,
          completedAt: new Date(),
        },
        tx,
      );

      const points = correctCount * POINTS_PER_CORRECT + (passed ? PASS_BONUS : 0);
      if (points > 0) {
        await gameRepo.incrementStudentPoints(authUser.id, points, tx);
      }

      if (existingAssignment) {
        await gameRepo.updateAssignmentStatus(
          existingAssignment.id,
          ASSIGNMENT_STATUSES.COMPLETED,
          tx,
        );
      }

      let issuedCertificate = null;
      if (passed) {
        const certConfig = game.configJson?.certificate ?? null;
        issuedCertificate = await certificateUsecase.issueForGameAttempt(
          {
            studentId: authUser.id,
            studentName: authUser.name,
            gameAttemptId: createdAttempt.id,
            titleAr: certConfig?.titleAr ?? game.titleAr,
            titleEn: certConfig?.titleEn ?? game.titleEn,
            bodyAr: certConfig?.bodyAr ?? null,
            bodyEn: certConfig?.bodyEn ?? null,
            // Per-game identity: each game's certificate renders with its own
            // look, keyed off the (stable, unique) game slug.
            templateKey: game.slug,
            themeJson: certConfig,
          },
          tx,
        );
      }

      return { attempt: createdAttempt, certificate: issuedCertificate };
    });

    // Side-effects on a pass — best-effort (must not fail the request).
    if (passed) {
      try {
        await notificationUsecase.createNotification({
          userId: authUser.id,
          type: NOTIFICATION_TYPES.GIFT_RECEIVED,
          titleAr: "أحسنت! حصلت على هدية",
          titleEn: "Well done! You earned a gift",
          link: "/dashboard",
          dataJson: { gameId: game.id, gameAttemptId: attempt.id },
        });
      } catch {
        // swallow — notification is best-effort
      }
      try {
        await rewardUsecase.grantBadge({
          userId: authUser.id,
          sourceType: "GAME",
          sourceId: game.id,
        });
      } catch {
        // swallow — reward is best-effort
      }
    }

    return { attempt, passed, certificate };
  }

  // ── attempts list ───────────────────────────────────────
  async listAttempts(authUser, id, params) {
    const game = await gameRepo.getById(id);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);

    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });

    const where = { gameId: game.id };
    // ADMIN sees all attempts for the game; everyone else only their own.
    if (authUser.role !== USER_ROLES.ADMIN) {
      where.studentId = authUser.id;
    }

    const { items, total } = await gameRepo.listAttempts(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }
}

export const gameUsecase = new GameUsecase();
