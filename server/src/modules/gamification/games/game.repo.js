// ===========================================================================
// game.repo — Prisma I/O only on Game / GameQuestion / GameOption /
// GameAssignment / GameAttempt. (Reference idiom: single object args with an
// optional `client`, lists own pagination and return
// { items, total, page, pageSize }, select/include projections kept intact.)
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { ASSIGNMENT_STATUSES, USER_ROLES } from "@aya/shared";
import { paginate } from "../../../shared/utility/pagination.js";
import {
  buildSearchQuery,
  parseBooleanFilter,
} from "../../../shared/utility/queryBuilders.js";
import { gameFullSelect, gameListSelect } from "./game.dto.js";

class GameRepo {
  // ── games ───────────────────────────────────────────────
  // Build the scoped Prisma `where` for the authenticated games list
  // (reference convention: where-building lives in the repo).
  //   ADMIN → optional active/public/type filters over everything
  //   PARENT / STUDENT → only active games (content is global), optional type
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

  async listGames({ where, page, limit, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const [items, total] = await Promise.all([
      db.game.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: gameListSelect,
      }),
      db.game.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).game.findUnique({
      where: { id },
      select: gameFullSelect,
    });
  }

  getBySlug({ slug, client } = {}) {
    return (client ?? prisma).game.findUnique({
      where: { slug },
      select: gameFullSelect,
    });
  }

  // One active public game with full questions/options.
  getPublicBySlug({ slug, client } = {}) {
    return (client ?? prisma).game.findFirst({
      where: { slug, isPublic: true, isActive: true },
      select: gameFullSelect,
    });
  }

  // The single public free-trial game (full questions/options) for /free-game.
  getPublicFree({ client } = {}) {
    return (client ?? prisma).game.findFirst({
      where: { isFree: true, isPublic: true, isActive: true },
      select: gameFullSelect,
    });
  }

  // The single free game as CARD data (list fields + configJson, no questions /
  // answer key) — shown alongside a student's assigned games on the dashboard.
  getFreeCard({ client } = {}) {
    return (client ?? prisma).game.findFirst({
      where: { isFree: true, isPublic: true, isActive: true },
      select: { ...gameListSelect, configJson: true },
    });
  }

  // ── free-game selection (admin) ─────────────────────────
  // Clear the free flag on every game (run inside the set-free transaction so
  // exactly one game ends up flagged).
  clearAllFreeFlags({ client } = {}) {
    return (client ?? prisma).game.updateMany({ data: { isFree: false } });
  }

  // Link (or unlink, badgeId=null) the badge auto-awarded on completing this game.
  setBadge({ id, badgeId, client } = {}) {
    return (client ?? prisma).game.update({
      where: { id },
      data: { badgeId },
      select: gameListSelect,
    });
  }

  // Mark ONE game as the free trial. It must be publicly playable, so we also
  // ensure it is public + active.
  markGameFree({ id, client } = {}) {
    return (client ?? prisma).game.update({
      where: { id },
      data: { isFree: true, isPublic: true, isActive: true },
      select: gameListSelect,
    });
  }

  // Active public games for the free landing list.
  listPublic({ client } = {}) {
    return (client ?? prisma).game.findMany({
      where: { isPublic: true, isActive: true },
      orderBy: { createdAt: "desc" },
      select: gameListSelect,
    });
  }

  // ── assignments ─────────────────────────────────────────
  upsertAssignment({ gameId, studentId, assignedById, dueAt, client } = {}) {
    return (client ?? prisma).gameAssignment.upsert({
      where: { gameId_studentId: { gameId, studentId } },
      update: {
        status: ASSIGNMENT_STATUSES.ASSIGNED,
        assignedById,
        dueAt: dueAt ?? null,
      },
      create: {
        gameId,
        studentId,
        assignedById,
        status: ASSIGNMENT_STATUSES.ASSIGNED,
        dueAt: dueAt ?? null,
      },
    });
  }

  getAssignment({ gameId, studentId, client } = {}) {
    return (client ?? prisma).gameAssignment.findUnique({
      where: { gameId_studentId: { gameId, studentId } },
    });
  }

  // All students assigned to a game (with their identity + assignment status).
  listAssignments({ gameId, client } = {}) {
    return (client ?? prisma).gameAssignment.findMany({
      where: { gameId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        studentId: true,
        status: true,
        dueAt: true,
        createdAt: true,
        student: { select: { id: true, name: true, nickname: true } },
      },
    });
  }

  deleteAssignment({ gameId, studentId, client } = {}) {
    return (client ?? prisma).gameAssignment.deleteMany({
      where: { gameId, studentId },
    });
  }

  // A student's assignments WITH full game-card data (list fields + configJson
  // for the theme/hero on the card). Used by the student's "My Games" grid and
  // by the admin's student-detail games tab. configJson carries no answer key.
  // Each row is enriched with `certificateId` — the student's earned GAME
  // certificate for that game (or null) — so a completed card can link to it.
  async listAssignmentsForStudent({ studentId, client } = {}) {
    const db = client ?? prisma;
    const assignments = await db.gameAssignment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        gameId: true,
        status: true,
        dueAt: true,
        createdAt: true,
        game: { select: { ...gameListSelect, configJson: true } },
      },
    });

    const gameIds = assignments.map((a) => a.gameId);
    if (gameIds.length === 0) return assignments;

    // One earned certificate per game (earliest), mapped by gameId.
    const certs = await db.certificate.findMany({
      where: { studentId, gameAttempt: { gameId: { in: gameIds } } },
      orderBy: { issuedAt: "asc" },
      select: { id: true, gameAttempt: { select: { gameId: true } } },
    });
    const certByGame = new Map();
    for (const c of certs) {
      const gid = c.gameAttempt?.gameId;
      if (gid != null && !certByGame.has(gid)) certByGame.set(gid, c.id);
    }

    return assignments.map((a) => ({
      ...a,
      certificateId: certByGame.get(a.gameId) ?? null,
    }));
  }

  updateAssignmentStatus({ id, status, client } = {}) {
    return (client ?? prisma).gameAssignment.update({
      where: { id },
      data: { status },
    });
  }

  // ── attempts ────────────────────────────────────────────
  createAttempt({ data, client } = {}) {
    return (client ?? prisma).gameAttempt.create({ data });
  }

  async listAttempts({ where, page, limit, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const [items, total] = await Promise.all([
      db.gameAttempt.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          gameId: true,
          studentId: true,
          score: true,
          correctCount: true,
          totalQuestions: true,
          passed: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          student: { select: { id: true, name: true, nickname: true } },
        },
      }),
      db.gameAttempt.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  // ── student points ──────────────────────────────────────
  incrementStudentPoints({ studentId, points, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id: studentId },
      data: { points: { increment: points } },
      select: { id: true, points: true },
    });
  }
}

export const gameRepo = new GameRepo();
export { GameRepo };
