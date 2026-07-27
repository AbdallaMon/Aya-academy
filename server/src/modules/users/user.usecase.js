import { prisma } from "@aya/db/prisma.client.js";
import {
  PARENT_RELATIONS,
  STUDENT_LEVELS,
  SUBSCRIPTION_STATUSES,
  USER_ROLES,
  attachmentMessagesCodes,
  messagesNames,
  userMessagesCodes,
} from "@aya/shared";
import { AppError, badRequest, forbidden, notFound } from "../../shared/errors/AppError.js";
import { attachmentRepo } from "../attachments/attachment.repo.js";
import { attachmentUsecase } from "../attachments/attachment.usecase.js";
import { hashPassword } from "../../infra/security/hash.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { subscriptionRepo } from "../finance/subscriptions/subscription.repo.js";
import { authRepo } from "../auth/auth.repo.js";
import { toChildItem, toOverviewParents, toUserListItem } from "./user.dto.js";
import { userRepo } from "./user.repo.js";

function identityConflict(code, field) {
  return new AppError({
    statusCode: 409,
    code,
    message: code,
    translationKey: messagesNames.userMessages,
    details: [{ field, path: field, message: code }],
  });
}

async function assertIdentityAvailable({ email, username, excludeId = null }) {
  if (email) {
    const existing = await userRepo.findByEmail(email);
    if (existing && existing.id !== excludeId) {
      throw identityConflict(userMessagesCodes.EMAIL_ALREADY_EXISTS, "email");
    }
  }
  if (username) {
    const existing = await userRepo.findByUsername(username);
    if (existing && existing.id !== excludeId) {
      throw identityConflict(
        userMessagesCodes.USERNAME_ALREADY_EXISTS,
        "username",
      );
    }
  }
}

function rethrowIdentityConstraint(error) {
  if (error?.code !== "P2002") throw error;
  const target = Array.isArray(error?.meta?.target)
    ? error.meta.target.join(" ")
    : String(error?.meta?.target ?? "");
  if (target.toLowerCase().includes("username")) {
    throw identityConflict(
      userMessagesCodes.USERNAME_ALREADY_EXISTS,
      "username",
    );
  }
  if (target.toLowerCase().includes("email")) {
    throw identityConflict(userMessagesCodes.EMAIL_ALREADY_EXISTS, "email");
  }
  throw error;
}

class UserUsecase {
  /** Throws unless `authUser` may access the target user. */
  async assertCanAccess(authUser, targetId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.id === targetId) return;
    if (authUser.role === USER_ROLES.PARENT) {
      // FROZEN positional call — cross-module userRepo signature.
      const linked = await userRepo.isStudentOfParent(authUser.id, targetId);
      if (linked) return;
    }
    throw forbidden(userMessagesCodes.CANNOT_ACCESS_USER);
  }

  async list({ page, limit, filters = {}, authUser }) {
    const { skip, take, page: currentPage, limit: pageLimit } = paginate({
      page,
      limit,
    });
    // Where-building now lives in the repo (reference convention).
    const { items, total } = await userRepo.listScoped({
      authUser,
      filters,
      skip,
      take,
    });

    // Batch the "subscribed this month" lookup for the student rows on this
    // page only — one query, no N+1.
    const studentIds = items
      .filter((u) => u.role === USER_ROLES.STUDENT)
      .map((u) => u.id);
    const subscribedIds = studentIds.length
      ? new Set(
          await subscriptionRepo.getCurrentlySubscribedStudentIds(studentIds),
        )
      : new Set();

    return paginatedResult(
      items.map((u) => toUserListItem(u, subscribedIds)),
      total,
      currentPage,
      pageLimit,
    );
  }

  async getById({ id, authUser }) {
    await this.assertCanAccess(authUser, id);
    // FROZEN positional call — cross-module userRepo signature.
    const user = await userRepo.getPublicById(id);
    if (!user) throw notFound(userMessagesCodes.USER_NOT_FOUND);
    return user;
  }

  async listMyStudents({ authUser }) {
    // FROZEN positional call — cross-module userRepo signature.
    const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
    const { items } = await userRepo.listUsers({
      where: { id: { in: studentIds } },
      skip: 0,
      take: 1000,
    });
    return items.map((u) => toUserListItem(u));
  }

  /**
   * Linked students of the parent `parentId`.
   * Scope: ADMIN → any parent; PARENT → only their own id; STUDENT → forbidden.
   */
  async getChildren({ parentId, authUser }) {
    if (authUser.role === USER_ROLES.PARENT && authUser.id !== parentId) {
      throw forbidden(userMessagesCodes.CANNOT_VIEW_CHILDREN);
    }
    if (
      authUser.role !== USER_ROLES.ADMIN &&
      authUser.role !== USER_ROLES.PARENT
    ) {
      throw forbidden(userMessagesCodes.CANNOT_VIEW_CHILDREN);
    }

    // FROZEN positional call — cross-module userRepo signature.
    const parentRow = await userRepo.getRoleById(parentId);
    if (!parentRow || parentRow.role !== USER_ROLES.PARENT) {
      throw new AppError({
        statusCode: 404,
        code: userMessagesCodes.PARENT_NOT_FOUND,
        message: userMessagesCodes.PARENT_NOT_FOUND,
        translationKey: messagesNames.userMessages,
      });
    }

    const links = await userRepo.getChildrenOfParent({ parentId });
    return links.map(toChildItem);
  }

  /** Admin creates any role; PARENT may only create STUDENTs (auto-linked). */
  async create({ authUser, ...input }) {
    let role = input.role;
    let parentIds = input.parentIds ?? [];

    if (authUser.role === USER_ROLES.PARENT) {
      role = USER_ROLES.STUDENT;
      parentIds = [authUser.id];
    }

    // FROZEN positional call — cross-module userRepo signature.
    await assertIdentityAvailable({
      email: input.email,
      username: input.username,
    });

    const passwordHash = await hashPassword(input.password);

    try {
      return await prisma.$transaction(async (tx) => {
      // FROZEN positional call — cross-module userRepo signature.
      const user = await userRepo.createUser(
        {
          name: input.name,
          email: input.email,
          username: input.username,
          passwordHash,
          role,
          phone: input.phone,
          locale: input.locale ?? "ar",
          nickname: input.nickname,
          birthDate: input.birthDate,
          avatarId: input.avatarId,
          createdById: authUser.id,
        },
        tx,
      );
      if (role === USER_ROLES.STUDENT) {
        for (const parentId of parentIds) {
          // FROZEN positional call — cross-module userRepo signature.
          await userRepo.linkParentStudent(
            parentId,
            user.id,
            PARENT_RELATIONS.GUARDIAN,
            tx,
          );
        }
      }
        return user;
      });
    } catch (error) {
      rethrowIdentityConstraint(error);
    }
  }

  async createStudent({ authUser, ...input }) {
    // FROZEN positional call — cross-module userRepo signature.
    await assertIdentityAvailable({
      email: input.email,
      username: input.username,
    });
    const passwordHash = await hashPassword(input.password);
    const relation = input.relation ?? PARENT_RELATIONS.GUARDIAN;

    try {
      return await prisma.$transaction(async (tx) => {
      // FROZEN positional call — cross-module userRepo signature.
      const user = await userRepo.createUser(
        {
          name: input.name,
          email: input.email,
          username: input.username,
          passwordHash,
          role: USER_ROLES.STUDENT,
          nickname: input.nickname,
          birthDate: input.birthDate,
          avatarId: input.avatarId,
          createdById: authUser.id,
        },
        tx,
      );
      // FROZEN positional call — cross-module userRepo signature.
      await userRepo.linkParentStudent(authUser.id, user.id, relation, tx);
        return user;
      });
    } catch (error) {
      rethrowIdentityConstraint(error);
    }
  }

  async update({ id, authUser, ...input }) {
    await this.assertCanAccess(authUser, id);
    const target = await userRepo.getIdentityById({ id });
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);

    const nextEmail =
      input.email !== undefined ? input.email : target.email;
    const nextUsername =
      input.username !== undefined ? input.username : target.username;
    if (!nextEmail && !nextUsername) {
      throw new AppError({
        statusCode: 422,
        code: userMessagesCodes.EMAIL_OR_USERNAME_REQUIRED,
        message: userMessagesCodes.EMAIL_OR_USERNAME_REQUIRED,
        translationKey: messagesNames.userMessages,
        details: ["email", "username"].map((field) => ({
          field,
          path: field,
          message: userMessagesCodes.EMAIL_OR_USERNAME_REQUIRED,
        })),
      });
    }

    const emailChanged =
      input.email !== undefined && input.email !== target.email;
    const usernameChanged =
      input.username !== undefined && input.username !== target.username;
    await assertIdentityAvailable({
      email: emailChanged ? input.email : null,
      username: usernameChanged ? input.username : null,
      excludeId: id,
    });

    const data = {
      name: input.name,
      email: input.email,
      username: input.username,
      phone: input.phone,
      locale: input.locale,
      nickname: input.nickname,
      birthDate: input.birthDate,
    };
    // only admin can toggle active state
    if (authUser.role === USER_ROLES.ADMIN && input.isActive !== undefined) {
      data.isActive = input.isActive;
      if (input.isActive === false) data.sessionVersion = { increment: 1 };
    }
    if (input.password) {
      data.passwordHash = await hashPassword(input.password);
    }
    if (input.password || emailChanged || usernameChanged) {
      data.sessionVersion = { increment: 1 };
    }
    try {
      return await prisma.$transaction(async (tx) => {
        const updated = await userRepo.updateUser({ id, data, client: tx });
        if (input.password || emailChanged) {
          await authRepo.deleteUserPasswordResets({
            userId: id,
            client: tx,
          });
        }
        return updated;
      });
    } catch (error) {
      rethrowIdentityConstraint(error);
    }
  }

  async remove({ id, authUser }) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_MODIFY_USER);
    }
    return userRepo.deactivateUser({ id });
  }

  async linkParent({ studentId, parentId, relation, authUser }) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_LINK_STUDENT);
    }
    // FROZEN positional calls — cross-module userRepo signature.
    const studentRow = await userRepo.getRoleById(studentId);
    const parentRow = await userRepo.getRoleById(parentId);
    if (!studentRow || studentRow.role !== USER_ROLES.STUDENT) {
      throw new AppError({
        statusCode: 400,
        code: userMessagesCodes.STUDENT_REQUIRED,
        message: userMessagesCodes.STUDENT_REQUIRED,
        translationKey: messagesNames.userMessages,
      });
    }
    if (!parentRow || parentRow.role !== USER_ROLES.PARENT) {
      throw new AppError({
        statusCode: 400,
        code: userMessagesCodes.PARENT_REQUIRED,
        message: userMessagesCodes.PARENT_REQUIRED,
        translationKey: messagesNames.userMessages,
      });
    }
    // FROZEN positional call — cross-module userRepo signature.
    return userRepo.linkParentStudent(
      parentId,
      studentId,
      relation ?? PARENT_RELATIONS.GUARDIAN,
    );
  }

  async unlinkParent({ studentId, parentId, authUser }) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_LINK_STUDENT);
    }
    return userRepo.unlinkParentStudent({ parentId, studentId });
  }

  /**
   * Role-adaptive aggregate for a user's detail screen.
   * STUDENT → profile + parents + subscriptions + certificates + badges + attempts.
   * PARENT  → contact + children (with quick stats).
   */
  async overview({ id, authUser }) {
    await this.assertCanAccess(authUser, id);
    const user = await userRepo.getOverviewUser({ id });
    if (!user) throw notFound(userMessagesCodes.USER_NOT_FOUND);

    if (user.role === USER_ROLES.STUDENT) {
      const [
        parentLinks,
        subs,
        certificatesCount,
        badgeRows,
        gameAttempts,
        quizAttempts,
        subscribedIds,
      ] = await Promise.all([
        userRepo.getStudentParents({ studentId: id }),
        subscriptionRepo.listSubscriptions({ studentId: id }, 0, 100),
        userRepo.countCertificates({ studentId: id }),
        userRepo.getStudentBadges({ studentId: id }),
        userRepo.getRecentGameAttempts({ studentId: id }),
        userRepo.getRecentQuizAttempts({ studentId: id }),
        subscriptionRepo.getCurrentlySubscribedStudentIds([id]),
      ]);

      const isActive = subscribedIds.includes(id);

      // Derive the subscription state visible to the frontend so it can
      // distinguish "pending renewal" from "truly expired/cancelled".
      // Pick the newest subscription defensively by max id (subs.items is
      // already newest-first per listSubscriptions, but max-by-id is safe
      // even if the ordering contract ever changes).
      const newest =
        subs.items.length > 0
          ? subs.items.reduce((a, b) => (b.id > a.id ? b : a))
          : null;
      const latestSubscriptionId = newest?.id ?? null;

      let subscriptionState;
      if (isActive) {
        subscriptionState = SUBSCRIPTION_STATUSES.ACTIVE;
      } else if (
        newest &&
        (newest.status === SUBSCRIPTION_STATUSES.PENDING ||
          newest.status === SUBSCRIPTION_STATUSES.UPCOMING)
      ) {
        subscriptionState = SUBSCRIPTION_STATUSES.PENDING;
      } else if (newest) {
        // EXPIRED or CANCELLED — treat both as expired from the viewer's
        // perspective (renewal CTA is the same either way).
        subscriptionState = SUBSCRIPTION_STATUSES.EXPIRED;
      } else {
        subscriptionState = "NONE";
      }

      // Non-admin viewers (parents) only see ACTIVATED subscriptions
      // (ACTIVE or EXPIRED). PENDING / UPCOMING / CANCELLED are internal
      // workflow states that parents have no UI for.
      const visibleSubs =
        authUser.role === USER_ROLES.ADMIN
          ? subs.items
          : subs.items.filter(
              (s) =>
                s.status === SUBSCRIPTION_STATUSES.ACTIVE ||
                s.status === SUBSCRIPTION_STATUSES.EXPIRED,
            );

      // Backend enforces the gate (not just the UI): for a non-admin viewer
      // (a parent) of an INACTIVE child, withhold the stats/achievements
      // (badges, points, attempts). Identity + subscriptions + certificates
      // count remain so renewal stays possible. ADMIN always sees everything.
      const hideAchievements =
        !isActive && authUser.role !== USER_ROLES.ADMIN;

      return {
        user,
        // Whether the student currently has an ACTIVE subscription — lets the
        // client lock achievement views for an inactive child (single source of
        // truth: subscriptionRepo.getCurrentlySubscribedStudentIds).
        isActive,
        // Richer state for the renewal UX: ACTIVE | PENDING | EXPIRED | NONE
        subscriptionState,
        // Id of the newest subscription (by id) — lets the frontend deep-link
        // directly to it for renewal without a separate fetch.
        latestSubscriptionId,
        parents: toOverviewParents(parentLinks),
        subscriptions: visibleSubs,
        certificatesCount,
        badges: hideAchievements
          ? []
          : badgeRows.map((row) => ({
              ...row.badge,
              awardedAt: row.awardedAt,
            })),
        attempts: hideAchievements
          ? { games: [], quizzes: [] }
          : { games: gameAttempts, quizzes: quizAttempts },
        pointsTotal: hideAchievements ? null : user.points,
      };
    }

    if (user.role === USER_ROLES.PARENT) {
      const links = await userRepo.getParentChildrenDetailed({ parentId: id });
      const childIds = links.map((l) => l.student.id);

      const [subscribedIds, certCounts] = await Promise.all([
        childIds.length
          ? subscriptionRepo.getCurrentlySubscribedStudentIds(childIds)
          : Promise.resolve([]),
        childIds.length
          ? userRepo.countCertificatesForStudents({ studentIds: childIds })
          : Promise.resolve([]),
      ]);
      const subscribedSet = new Set(subscribedIds);
      const certByStudent = new Map(
        certCounts.map((c) => [c.studentId, c._count?._all ?? 0]),
      );

      return {
        user,
        children: links.map((l) => ({
          id: l.student.id,
          name: l.student.name,
          nickname: l.student.nickname,
          studentLevel: l.student.studentLevel,
          points: l.student.points,
          isActive: l.student.isActive,
          activeSubscription: subscribedSet.has(l.student.id),
          certificatesCount: certByStudent.get(l.student.id) ?? 0,
        })),
      };
    }

    // ADMIN (or any other role) → just the user profile.
    return { user };
  }

  /** Admin sets a STUDENT's level. */
  async setLevel({ id, studentLevel, authUser }) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_MODIFY_USER);
    }
    if (!Object.values(STUDENT_LEVELS).includes(studentLevel)) {
      throw badRequest(
        userMessagesCodes.INVALID_STUDENT_LEVEL,
        messagesNames.userMessages,
      );
    }
    // FROZEN positional call — cross-module userRepo signature.
    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);
    if (target.role !== USER_ROLES.STUDENT) {
      throw badRequest(
        userMessagesCodes.NOT_A_STUDENT,
        messagesNames.userMessages,
      );
    }
    return userRepo.setStudentLevel({ id, studentLevel });
  }

  /** Admin bans a user (cannot ban self or another admin). Invalidates tokens. */
  async ban({ id, reason, authUser }) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_MODIFY_USER);
    }
    if (id === authUser.id) {
      throw badRequest(
        userMessagesCodes.CANNOT_BAN_SELF,
        messagesNames.userMessages,
      );
    }
    // FROZEN positional call — cross-module userRepo signature.
    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);
    if (target.role === USER_ROLES.ADMIN) {
      throw badRequest(
        userMessagesCodes.CANNOT_BAN_ADMIN,
        messagesNames.userMessages,
      );
    }
    return userRepo.banUser({ id, reason });
  }

  /** Admin unbans a user. */
  async unban({ id, authUser }) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_MODIFY_USER);
    }
    // FROZEN positional call — cross-module userRepo signature.
    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);
    return userRepo.unbanUser({ id });
  }

  /**
   * Throws unless `authUser` may change the avatar of the target user.
   * Scope: ADMIN → any; the user themselves → own; a PARENT → their student.
   */
  async assertCanSetAvatar(authUser, targetId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.id === targetId) return;
    if (authUser.role === USER_ROLES.PARENT) {
      // FROZEN positional call — cross-module userRepo signature.
      const linked = await userRepo.isStudentOfParent(authUser.id, targetId);
      if (linked) return;
    }
    throw forbidden(attachmentMessagesCodes.CANNOT_SET_AVATAR);
  }

  /** Set a user's avatar to an existing uploaded attachment (scoped). */
  async setAvatar({ id, attachmentId, authUser }) {
    await this.assertCanSetAvatar(authUser, id);

    // FROZEN positional call — cross-module userRepo signature.
    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);

    const attachment = await attachmentRepo.getById(attachmentId);
    if (!attachment) {
      throw notFound(attachmentMessagesCodes.ATTACHMENT_NOT_FOUND);
    }
    if (
      authUser.role !== USER_ROLES.ADMIN &&
      attachment.uploadedById !== authUser.id
    ) {
      throw forbidden(attachmentMessagesCodes.CANNOT_SET_AVATAR);
    }

    const { avatarId: previousAvatarId } =
      (await userRepo.getAvatarId({ id })) || {};
    const updated = await userRepo.setAvatar({ id, attachmentId });
    if (previousAvatarId && previousAvatarId !== attachmentId) {
      await attachmentUsecase.deleteIfOrphaned(previousAvatarId);
    }
    return updated;
  }

  /** Clear a user's avatar (scoped) and remove the now-orphaned upload. */
  async removeAvatar({ id, authUser }) {
    await this.assertCanSetAvatar(authUser, id);

    // FROZEN positional call — cross-module userRepo signature.
    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);

    const { avatarId: previousAvatarId } =
      (await userRepo.getAvatarId({ id })) || {};
    const result = await userRepo.clearAvatar({ id });
    // Drop the upload (row + file) if nothing else points at it.
    if (previousAvatarId) {
      await attachmentUsecase.deleteIfOrphaned(previousAvatarId);
    }
    return result;
  }
}

export const userUsecase = new UserUsecase();
export { UserUsecase };
