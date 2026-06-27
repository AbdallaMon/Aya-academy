import { prisma } from "@aya/db/prisma.client.js";
import {
  PARENT_RELATIONS,
  STUDENT_LEVELS,
  USER_ROLES,
  attachmentMessagesCodes,
  messagesNames,
  userMessagesCodes,
} from "@aya/shared";
import { AppError, badRequest, conflict, forbidden, notFound } from "../../shared/errors/AppError.js";
import { attachmentRepo } from "../attachments/attachment.repo.js";
import { hashPassword } from "../../infra/security/hash.js";
import { buildSearchQuery, parseBooleanFilter } from "../../shared/utility/helper.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { subscriptionRepo } from "../subscriptions/subscription.repo.js";
import { toChildItem, toOverviewParents, toUserListItem } from "./user.dto.js";
import { userRepo } from "./user.repo.js";

class UserUsecase {
  /** Throws unless `authUser` may access the target user. */
  async assertCanAccess(authUser, targetId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.id === targetId) return;
    if (authUser.role === USER_ROLES.PARENT) {
      const linked = await userRepo.isStudentOfParent(authUser.id, targetId);
      if (linked) return;
    }
    throw forbidden(userMessagesCodes.CANNOT_ACCESS_USER);
  }

  async buildListWhere(authUser, { search, role, isActive }) {
    const where = {};
    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["name", "email", "nickname"],
    });
    if (or) where.OR = or;

    const active = parseBooleanFilter(isActive);
    if (active !== undefined) where.isActive = active;

    if (authUser.role === USER_ROLES.ADMIN) {
      if (role && role !== "ALL") where.role = role;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
      where.id = { in: studentIds };
      where.role = USER_ROLES.STUDENT;
    } else {
      where.id = authUser.id;
    }
    return where;
  }

  async list(authUser, params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = await this.buildListWhere(authUser, params);
    const { items, total } = await userRepo.listUsers(where, skip, take);

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
      page,
      limit,
    );
  }

  async getById(authUser, id) {
    await this.assertCanAccess(authUser, id);
    const user = await userRepo.getPublicById(id);
    if (!user) throw notFound(userMessagesCodes.USER_NOT_FOUND);
    return user;
  }

  async listMyStudents(authUser) {
    const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
    const { items } = await userRepo.listUsers(
      { id: { in: studentIds } },
      0,
      1000,
    );
    return items.map(toUserListItem);
  }

  /**
   * Linked students of the parent `parentId`.
   * Scope: ADMIN → any parent; PARENT → only their own id; STUDENT → forbidden.
   */
  async getChildren(authUser, parentId) {
    if (authUser.role === USER_ROLES.PARENT && authUser.id !== parentId) {
      throw forbidden(userMessagesCodes.CANNOT_VIEW_CHILDREN);
    }
    if (
      authUser.role !== USER_ROLES.ADMIN &&
      authUser.role !== USER_ROLES.PARENT
    ) {
      throw forbidden(userMessagesCodes.CANNOT_VIEW_CHILDREN);
    }

    const parentRow = await userRepo.getRoleById(parentId);
    if (!parentRow || parentRow.role !== USER_ROLES.PARENT) {
      throw new AppError({
        statusCode: 404,
        code: userMessagesCodes.PARENT_NOT_FOUND,
        message: userMessagesCodes.PARENT_NOT_FOUND,
        translationKey: messagesNames.userMessages,
      });
    }

    const links = await userRepo.getChildrenOfParent(parentId);
    return links.map(toChildItem);
  }

  /** Admin creates any role; PARENT may only create STUDENTs (auto-linked). */
  async create(authUser, input) {
    let role = input.role;
    let parentIds = input.parentIds ?? [];

    if (authUser.role === USER_ROLES.PARENT) {
      role = USER_ROLES.STUDENT;
      parentIds = [authUser.id];
    }

    const existing = await userRepo.findByEmail(input.email);
    if (existing) throw conflict(userMessagesCodes.EMAIL_ALREADY_EXISTS);

    const passwordHash = await hashPassword(input.password);

    return prisma.$transaction(async (tx) => {
      const user = await userRepo.createUser(
        {
          name: input.name,
          email: input.email,
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
  }

  async createStudent(authUser, input) {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) throw conflict(userMessagesCodes.EMAIL_ALREADY_EXISTS);
    const passwordHash = await hashPassword(input.password);
    const relation = input.relation ?? PARENT_RELATIONS.GUARDIAN;

    return prisma.$transaction(async (tx) => {
      const user = await userRepo.createUser(
        {
          name: input.name,
          email: input.email,
          passwordHash,
          role: USER_ROLES.STUDENT,
          nickname: input.nickname,
          birthDate: input.birthDate,
          avatarId: input.avatarId,
          createdById: authUser.id,
        },
        tx,
      );
      await userRepo.linkParentStudent(authUser.id, user.id, relation, tx);
      return user;
    });
  }

  async update(authUser, id, input) {
    await this.assertCanAccess(authUser, id);
    const data = {
      name: input.name,
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
      data.sessionVersion = { increment: 1 };
    }
    return userRepo.updateUser(id, data);
  }

  async remove(authUser, id) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_MODIFY_USER);
    }
    return userRepo.deactivateUser(id);
  }

  async linkParent(authUser, studentId, parentId, relation) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_LINK_STUDENT);
    }
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
    return userRepo.linkParentStudent(
      parentId,
      studentId,
      relation ?? PARENT_RELATIONS.GUARDIAN,
    );
  }

  async unlinkParent(authUser, studentId, parentId) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_LINK_STUDENT);
    }
    return userRepo.unlinkParentStudent(parentId, studentId);
  }

  /**
   * Role-adaptive aggregate for a user's detail screen.
   * STUDENT → profile + parents + subscriptions + certificates + badges + attempts.
   * PARENT  → contact + children (with quick stats).
   */
  async overview(authUser, id) {
    await this.assertCanAccess(authUser, id);
    const user = await userRepo.getOverviewUser(id);
    if (!user) throw notFound(userMessagesCodes.USER_NOT_FOUND);

    if (user.role === USER_ROLES.STUDENT) {
      const [
        parentLinks,
        subs,
        certificatesCount,
        badgeRows,
        gameAttempts,
        quizAttempts,
      ] = await Promise.all([
        userRepo.getStudentParents(id),
        subscriptionRepo.listSubscriptions({ studentId: id }, 0, 100),
        userRepo.countCertificates(id),
        userRepo.getStudentBadges(id),
        userRepo.getRecentGameAttempts(id),
        userRepo.getRecentQuizAttempts(id),
      ]);

      return {
        user,
        parents: toOverviewParents(parentLinks),
        subscriptions: subs.items,
        certificatesCount,
        badges: badgeRows.map((row) => ({
          ...row.badge,
          awardedAt: row.awardedAt,
        })),
        attempts: { games: gameAttempts, quizzes: quizAttempts },
        pointsTotal: user.points,
      };
    }

    if (user.role === USER_ROLES.PARENT) {
      const links = await userRepo.getParentChildrenDetailed(id);
      const childIds = links.map((l) => l.student.id);

      const [subscribedIds, certCounts] = await Promise.all([
        childIds.length
          ? subscriptionRepo.getCurrentlySubscribedStudentIds(childIds)
          : Promise.resolve([]),
        childIds.length
          ? userRepo.countCertificatesForStudents(childIds)
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
  async setLevel(authUser, id, studentLevel) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_MODIFY_USER);
    }
    if (!Object.values(STUDENT_LEVELS).includes(studentLevel)) {
      throw badRequest(
        userMessagesCodes.INVALID_STUDENT_LEVEL,
        messagesNames.userMessages,
      );
    }
    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);
    if (target.role !== USER_ROLES.STUDENT) {
      throw badRequest(
        userMessagesCodes.NOT_A_STUDENT,
        messagesNames.userMessages,
      );
    }
    return userRepo.setStudentLevel(id, studentLevel);
  }

  /** Admin bans a user (cannot ban self or another admin). Invalidates tokens. */
  async ban(authUser, id, reason) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_MODIFY_USER);
    }
    if (id === authUser.id) {
      throw badRequest(
        userMessagesCodes.CANNOT_BAN_SELF,
        messagesNames.userMessages,
      );
    }
    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);
    if (target.role === USER_ROLES.ADMIN) {
      throw badRequest(
        userMessagesCodes.CANNOT_BAN_ADMIN,
        messagesNames.userMessages,
      );
    }
    return userRepo.banUser(id, reason);
  }

  /** Admin unbans a user. */
  async unban(authUser, id) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(userMessagesCodes.CANNOT_MODIFY_USER);
    }
    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);
    return userRepo.unbanUser(id);
  }

  /**
   * Throws unless `authUser` may change the avatar of the target user.
   * Scope: ADMIN → any; the user themselves → own; a PARENT → their student.
   */
  async assertCanSetAvatar(authUser, targetId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.id === targetId) return;
    if (authUser.role === USER_ROLES.PARENT) {
      const linked = await userRepo.isStudentOfParent(authUser.id, targetId);
      if (linked) return;
    }
    throw forbidden(attachmentMessagesCodes.CANNOT_SET_AVATAR);
  }

  /** Set a user's avatar to an existing uploaded attachment (scoped). */
  async setAvatar(authUser, id, attachmentId) {
    await this.assertCanSetAvatar(authUser, id);

    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);

    const attachment = await attachmentRepo.getById(attachmentId);
    if (!attachment) {
      throw notFound(attachmentMessagesCodes.ATTACHMENT_NOT_FOUND);
    }

    return userRepo.setAvatar(id, attachmentId);
  }

  /** Clear a user's avatar (scoped). */
  async removeAvatar(authUser, id) {
    await this.assertCanSetAvatar(authUser, id);

    const target = await userRepo.getRoleById(id);
    if (!target) throw notFound(userMessagesCodes.USER_NOT_FOUND);

    return userRepo.clearAvatar(id);
  }
}

export const userUsecase = new UserUsecase();
