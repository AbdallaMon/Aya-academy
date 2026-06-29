import { NOTIFICATION_TYPES, USER_ROLES, messagesNames } from "@aya/shared";
import { assertActiveForStudent } from "../../shared/access/subscriptionAccess.js";
import { prisma } from "@aya/db/prisma.client.js";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors/AppError.js";
import { buildSearchQuery } from "../../shared/utility/helper.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { userRepo } from "../users/user.repo.js";
import { pointUsecase } from "../points/point.usecase.js";
import { notificationUsecase } from "../notifications/notification.usecase.js";
import { badgeRepo } from "./badge.repo.js";
import { toAwardedBadgeItem } from "./badge.dto.js";
import { badgeMessagesCodes } from "./badge.messages.js";

function isUniqueViolation(err) {
  return err?.code === "P2002";
}

class BadgeUsecase {
  /** Throws unless `authUser` may read the given student's badges. */
  async assertCanAccess(authUser, studentId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    let allowed = false;
    if (authUser.role === USER_ROLES.STUDENT) {
      allowed = authUser.id === studentId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      allowed = await userRepo.isStudentOfParent(authUser.id, studentId);
    }
    if (!allowed) throw forbidden(badgeMessagesCodes.CANNOT_ACCESS_BADGE);
    // Achievements hidden when the student's subscription is not active.
    await assertActiveForStudent(studentId);
  }

  async list(_authUser, { page, limit, search }) {
    const { skip, take, page: p, limit: l } = paginate({ page, limit });
    const where = {};
    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["nameAr", "nameEn", "code"],
    });
    if (or) where.OR = or;
    const { items, total } = await badgeRepo.list(where, skip, take);
    return paginatedResult(items, total, p, l);
  }

  async getById(id) {
    const badge = await badgeRepo.getById(id);
    if (!badge) throw notFound(badgeMessagesCodes.BADGE_NOT_FOUND);
    return badge;
  }

  async create(_authUser, input) {
    const data = {
      code: input.code,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      emoji: input.emoji,
      bgColor: input.bgColor,
      textColor: input.textColor,
      score: input.score,
      isActive: input.isActive ?? true,
    };
    try {
      return await badgeRepo.create(data);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict(
          badgeMessagesCodes.BADGE_CODE_EXISTS,
          messagesNames.badgeMessages,
        );
      }
      throw err;
    }
  }

  async update(_authUser, id, input) {
    const existing = await badgeRepo.getById(id);
    if (!existing) throw notFound(badgeMessagesCodes.BADGE_NOT_FOUND);

    const data = {
      code: input.code,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      emoji: input.emoji,
      bgColor: input.bgColor,
      textColor: input.textColor,
      score: input.score,
      isActive: input.isActive,
    };
    try {
      return await badgeRepo.update(id, data);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict(
          badgeMessagesCodes.BADGE_CODE_EXISTS,
          messagesNames.badgeMessages,
        );
      }
      throw err;
    }
  }

  async remove(_authUser, id) {
    const existing = await badgeRepo.getById(id);
    if (!existing) throw notFound(badgeMessagesCodes.BADGE_NOT_FOUND);
    return badgeRepo.remove(id);
  }

  /** A student's awarded badges (scoped). */
  async listStudentBadges(authUser, studentId) {
    await this.assertCanAccess(authUser, studentId);
    const rows = await badgeRepo.listStudentBadges(studentId);
    return rows.map(toAwardedBadgeItem);
  }

  /**
   * Admin awards a badge to a student: create the StudentBadge + grant the
   * badge's score as BADGE-sourced points, atomically.
   */
  async award(authUser, badgeId, { studentId }) {
    const badge = await badgeRepo.getById(badgeId);
    if (!badge) throw notFound(badgeMessagesCodes.BADGE_NOT_FOUND);

    const target = await userRepo.getRoleById(studentId);
    if (!target || target.role !== USER_ROLES.STUDENT) {
      throw badRequest(
        badgeMessagesCodes.NOT_A_STUDENT,
        messagesNames.badgeMessages,
      );
    }

    let studentBadge;
    try {
      studentBadge = await prisma.$transaction(async (tx) => {
        const sb = await badgeRepo.createStudentBadge(
          { studentId, badgeId, awardedById: authUser.id },
          tx,
        );
        await pointUsecase.awardForBadge(tx, {
          studentId,
          badgeId,
          amount: badge.score,
          awardedById: authUser.id,
          sourceId: sb.id,
        });
        return sb;
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict(
          badgeMessagesCodes.ALREADY_AWARDED,
          messagesNames.badgeMessages,
        );
      }
      throw err;
    }

    // Notify the student (best-effort).
    try {
      await notificationUsecase.createNotification({
        userId: studentId,
        type: NOTIFICATION_TYPES.GIFT_RECEIVED,
        titleAr: "حصلت على وسام جديد 🎉",
        titleEn: "You earned a new badge 🎉",
        link: "/dashboard/badges",
      });
    } catch {
      // swallow — notification is best-effort
    }

    return toAwardedBadgeItem(studentBadge);
  }

  /**
   * Reusable auto-award (no admin/auth required) — used by side-effects such as
   * completing a game. Idempotent: silently no-ops if the badge is missing /
   * inactive or the student already has it, so callers can fire it best-effort.
   * Grants the badge's score as BADGE-sourced points in the same transaction.
   * Returns the awarded item, or null when nothing was granted.
   */
  async awardToStudent({ studentId, badgeId, awardedById = null }) {
    const badge = await badgeRepo.getById(badgeId);
    if (!badge || !badge.isActive) return null;

    const existing = await badgeRepo.findStudentBadge(studentId, badgeId);
    if (existing) return null;

    let studentBadge;
    try {
      studentBadge = await prisma.$transaction(async (tx) => {
        const sb = await badgeRepo.createStudentBadge(
          { studentId, badgeId, awardedById },
          tx,
        );
        await pointUsecase.awardForBadge(tx, {
          studentId,
          badgeId,
          amount: badge.score,
          awardedById,
          sourceId: sb.id,
        });
        return sb;
      });
    } catch (err) {
      // Lost a race for the same (studentId, badgeId) — already awarded, no-op.
      if (isUniqueViolation(err)) return null;
      throw err;
    }

    try {
      await notificationUsecase.createNotification({
        userId: studentId,
        type: NOTIFICATION_TYPES.GIFT_RECEIVED,
        titleAr: "حصلت على وسام جديد 🎉",
        titleEn: "You earned a new badge 🎉",
        link: "/dashboard/badges",
      });
    } catch {
      // swallow — notification is best-effort
    }

    return toAwardedBadgeItem(studentBadge);
  }

  /**
   * Admin revokes a previously awarded badge: delete the StudentBadge + reverse
   * the granted points, atomically.
   */
  async revoke(authUser, badgeId, { studentId }) {
    const badge = await badgeRepo.getById(badgeId);
    if (!badge) throw notFound(badgeMessagesCodes.BADGE_NOT_FOUND);

    const existing = await badgeRepo.findStudentBadge(studentId, badgeId);
    if (!existing) {
      throw conflict(
        badgeMessagesCodes.NOT_AWARDED,
        messagesNames.badgeMessages,
      );
    }

    await prisma.$transaction(async (tx) => {
      await badgeRepo.deleteStudentBadge(existing.id, tx);
      await pointUsecase.reverseForBadge(tx, {
        studentId,
        badgeId,
        amount: badge.score,
        awardedById: authUser.id,
      });
    });

    return toAwardedBadgeItem(existing);
  }
}

export const badgeUsecase = new BadgeUsecase();
