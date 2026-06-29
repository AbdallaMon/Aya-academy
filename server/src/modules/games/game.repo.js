import { prisma } from "@aya/db/prisma.client.js";
import { ASSIGNMENT_STATUSES } from "@aya/shared";
import { gameFullSelect, gameListSelect } from "./game.dto.js";

class GameRepo {
  // ── games ───────────────────────────────────────────────
  async listGames(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.game.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: gameListSelect,
      }),
      prisma.game.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.game.findUnique({
      where: { id },
      select: gameFullSelect,
    });
  }

  getBySlug(slug) {
    return prisma.game.findUnique({
      where: { slug },
      select: gameFullSelect,
    });
  }

  // One active public game with full questions/options.
  getPublicBySlug(slug) {
    return prisma.game.findFirst({
      where: { slug, isPublic: true, isActive: true },
      select: gameFullSelect,
    });
  }

  // The single public free-trial game (full questions/options) for /free-game.
  getPublicFree() {
    return prisma.game.findFirst({
      where: { isFree: true, isPublic: true, isActive: true },
      select: gameFullSelect,
    });
  }

  // The single free game as CARD data (list fields + configJson, no questions /
  // answer key) — shown alongside a student's assigned games on the dashboard.
  getFreeCard() {
    return prisma.game.findFirst({
      where: { isFree: true, isPublic: true, isActive: true },
      select: { ...gameListSelect, configJson: true },
    });
  }

  // ── free-game selection (admin) ─────────────────────────
  // Clear the free flag on every game (run inside the set-free transaction so
  // exactly one game ends up flagged).
  clearAllFreeFlags(tx) {
    const client = tx ?? prisma;
    return client.game.updateMany({ data: { isFree: false } });
  }

  // Link (or unlink, badgeId=null) the badge auto-awarded on completing this game.
  setBadge(id, badgeId, tx) {
    const client = tx ?? prisma;
    return client.game.update({
      where: { id },
      data: { badgeId },
      select: gameListSelect,
    });
  }

  // Mark ONE game as the free trial. It must be publicly playable, so we also
  // ensure it is public + active.
  markGameFree(id, tx) {
    const client = tx ?? prisma;
    return client.game.update({
      where: { id },
      data: { isFree: true, isPublic: true, isActive: true },
      select: gameListSelect,
    });
  }

  // Active public games for the free landing list.
  listPublic() {
    return prisma.game.findMany({
      where: { isPublic: true, isActive: true },
      orderBy: { createdAt: "desc" },
      select: gameListSelect,
    });
  }

  // ── assignments ─────────────────────────────────────────
  upsertAssignment({ gameId, studentId, assignedById, dueAt }, tx) {
    const client = tx ?? prisma;
    return client.gameAssignment.upsert({
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

  getAssignment(gameId, studentId) {
    return prisma.gameAssignment.findUnique({
      where: { gameId_studentId: { gameId, studentId } },
    });
  }

  // All students assigned to a game (with their identity + assignment status).
  listAssignments(gameId) {
    return prisma.gameAssignment.findMany({
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

  deleteAssignment(gameId, studentId) {
    return prisma.gameAssignment.deleteMany({ where: { gameId, studentId } });
  }

  // A student's assignments WITH full game-card data (list fields + configJson
  // for the theme/hero on the card). Used by the student's "My Games" grid and
  // by the admin's student-detail games tab. configJson carries no answer key.
  // Each row is enriched with `certificateId` — the student's earned GAME
  // certificate for that game (or null) — so a completed card can link to it.
  async listAssignmentsForStudent(studentId) {
    const assignments = await prisma.gameAssignment.findMany({
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
    const certs = await prisma.certificate.findMany({
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

  updateAssignmentStatus(id, status, tx) {
    const client = tx ?? prisma;
    return client.gameAssignment.update({
      where: { id },
      data: { status },
    });
  }

  // ── attempts ────────────────────────────────────────────
  createAttempt(data, tx) {
    const client = tx ?? prisma;
    return client.gameAttempt.create({ data });
  }

  async listAttempts(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.gameAttempt.findMany({
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
      prisma.gameAttempt.count({ where }),
    ]);
    return { items, total };
  }

  // ── student points ──────────────────────────────────────
  incrementStudentPoints(studentId, points, tx) {
    const client = tx ?? prisma;
    return client.user.update({
      where: { id: studentId },
      data: { points: { increment: points } },
      select: { id: true, points: true },
    });
  }
}

export const gameRepo = new GameRepo();
