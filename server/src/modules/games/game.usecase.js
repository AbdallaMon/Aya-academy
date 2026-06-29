import { prisma } from "@aya/db/prisma.client.js";
import {
  ASSIGNMENT_STATUSES,
  NOTIFICATION_TYPES,
  USER_ROLES,
} from "@aya/shared";
import { badRequest, forbidden, notFound } from "../../shared/errors/AppError.js";
import {
  hasActiveSubscription,
  assertActiveForStudent,
} from "../../shared/access/subscriptionAccess.js";
import {
  buildSearchQuery,
  parseBooleanFilter,
} from "../../shared/utility/helper.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { badgeUsecase } from "../badges/badge.usecase.js";
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

  // A game is exempt from subscription gating when it is the public free game.
  isFreeGame(game) {
    return Boolean(game?.isFree && game?.isPublic);
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

  // ── badge linking (admin, GAME.MANAGE) ──────────────────
  // Link the badge auto-awarded when a student completes (passes) this game, or
  // unlink it (badgeId=null). Verifies both the game and the target badge exist.
  async setBadge(authUser, id, badgeId) {
    const game = await gameRepo.getById(id);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);

    // getById throws notFound(BADGE_NOT_FOUND) if the badge doesn't exist.
    if (badgeId != null) await badgeUsecase.getById(badgeId);

    return gameRepo.setBadge(game.id, badgeId);
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

    // Students need an ACTIVE subscription to play — except the free game.
    if (authUser.role === USER_ROLES.STUDENT && !this.isFreeGame(game)) {
      await assertActiveForStudent(authUser.id);
    }
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
    const assignments = await gameRepo.listAssignmentsForStudent(authUser.id);
    const active = await hasActiveSubscription(authUser.id);
    // Cards stay visible but are locked when the student is inactive,
    // unless the game itself is the public free game.
    return assignments.map((a) => ({
      ...a,
      locked: !active && !this.isFreeGame(a.game),
    }));
  }

  /**
   * Admin (GAME.ASSIGN): a specific student's game assignments — powers the
   * student-detail "games" tab (view + add/remove). The route already enforces
   * GAME.ASSIGN; admins manage every student so no extra scope is needed.
   */
  async studentAssignments(authUser, studentId) {
    return gameRepo.listAssignmentsForStudent(studentId);
  }

  /**
   * The single public free game (card data) — shown to a signed-in student on
   * their dashboard alongside their assigned games. Returns null if none is set.
   */
  async getMyFreeGame() {
    return gameRepo.getFreeCard();
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

    // Submitting a result requires an active subscription — except the free game.
    if (!this.isFreeGame(game)) {
      await assertActiveForStudent(authUser.id);
    }

    const correctCount = input.correctCount;
    const totalQuestions = input.totalQuestions;
    const passed =
      game.passThreshold == null ? true : correctCount >= game.passThreshold;
    const score = correctCount;

    const existingAssignment = await gameRepo.getAssignment(game.id, authUser.id);

    // Rewards (points + certificate + badge + gift) are earned ONCE, on the first
    // successful completion. A student may replay freely afterwards for practice:
    // every replay still records an attempt, but never re-grants anything and never
    // mints a second certificate. We use the existing GAME certificate as the
    // "already completed" marker (and re-surface it so the end-of-game screen can
    // still show/download it on a replay).
    const existingCertificate = await certificateUsecase.findEarnedForGame(
      authUser.id,
      game.id,
    );
    const firstCompletion = passed && !existingCertificate;

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

      if (firstCompletion) {
        const points = correctCount * POINTS_PER_CORRECT + PASS_BONUS;
        if (points > 0) {
          await gameRepo.incrementStudentPoints(authUser.id, points, tx);
        }
      }

      if (existingAssignment) {
        await gameRepo.updateAssignmentStatus(
          existingAssignment.id,
          ASSIGNMENT_STATUSES.COMPLETED,
          tx,
        );
      }

      let issuedCertificate = null;
      if (firstCompletion) {
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
            // Record the linked badge on the certificate itself.
            badgeId: game.badgeId ?? undefined,
          },
          tx,
        );
      }

      return { attempt: createdAttempt, certificate: issuedCertificate };
    });

    // First-completion side-effects — best-effort (must not fail the request).
    let awardedBadge = null;
    if (firstCompletion) {
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
      // Auto-award the linked badge (+ its points), linked to the certificate
      // that was just issued. Idempotent + best-effort. The awarded badge is
      // returned so the end-of-game screen can celebrate it.
      if (game.badgeId) {
        try {
          awardedBadge = await badgeUsecase.awardToStudent({
            studentId: authUser.id,
            badgeId: game.badgeId,
            certificateId: certificate?.id ?? null,
          });
        } catch {
          // swallow — badge award is best-effort
        }
      }
      // Notify the student's parent(s) about the new certificate.
      if (certificate) {
        await certificateUsecase.notifyParentsOfCertificate(certificate);
      }
    }

    // Always hand back a certificate when one exists (fresh or previously earned),
    // so replays keep their download link. `badge` is set only on the first
    // completion that actually granted a (newly-owned) linked badge.
    return {
      attempt,
      passed,
      certificate: certificate ?? existingCertificate,
      badge: awardedBadge,
    };
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
