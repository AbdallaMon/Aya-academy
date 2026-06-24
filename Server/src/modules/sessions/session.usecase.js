import {
  USER_ROLES,
  messagesNames,
} from "@aya/shared";
import { AppError, badRequest, forbidden, notFound } from "../../shared/errors/AppError.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { userRepo } from "../users/user.repo.js";
import { sessionRepo } from "./session.repo.js";
import { sessionMessagesCodes } from "./session.messages.js";

class SessionUsecase {
  /** Throws unless `authUser` may access the given session (by its studentId). */
  async assertCanAccess(authUser, studentId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.role === USER_ROLES.STUDENT) {
      if (authUser.id === studentId) return;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const linked = await userRepo.isStudentOfParent(authUser.id, studentId);
      if (linked) return;
    }
    throw forbidden(sessionMessagesCodes.CANNOT_ACCESS_SESSION);
  }

  async buildListWhere(authUser, { studentId, status, from, to }) {
    const where = {};

    if (status) where.status = status;

    if (from || to) {
      where.startsAt = {};
      if (from) where.startsAt.gte = from;
      if (to) where.startsAt.lte = to;
    }

    if (authUser.role === USER_ROLES.ADMIN) {
      if (studentId) where.studentId = studentId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
      const scoped =
        studentId && studentIds.includes(studentId) ? [studentId] : studentIds;
      where.studentId = { in: scoped };
    } else {
      where.studentId = authUser.id;
    }
    return where;
  }

  async list(authUser, params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = await this.buildListWhere(authUser, params);
    const { items, total } = await sessionRepo.listSessions(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }

  async getById(authUser, id) {
    const session = await sessionRepo.getById(id);
    if (!session) throw notFound(sessionMessagesCodes.SESSION_NOT_FOUND);
    await this.assertCanAccess(authUser, session.studentId);
    return session;
  }

  async create(authUser, input) {
    if (input.endsAt <= input.startsAt) {
      throw new AppError({
        statusCode: 400,
        code: sessionMessagesCodes.INVALID_TIME_RANGE,
        message: sessionMessagesCodes.INVALID_TIME_RANGE,
        translationKey: messagesNames.sessionMessages,
      });
    }

    const data = {
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: input.status,
      meetingLink: input.meetingLink,
      notes: input.notes,
      student: { connect: { id: input.studentId } },
      createdBy: { connect: { id: authUser.id } },
    };
    if (input.subscriptionId !== undefined) {
      data.subscription = { connect: { id: input.subscriptionId } };
    }

    return sessionRepo.createSession(data);
  }

  async update(authUser, id, input) {
    const existing = await sessionRepo.getById(id);
    if (!existing) throw notFound(sessionMessagesCodes.SESSION_NOT_FOUND);

    const startsAt = input.startsAt ?? existing.startsAt;
    const endsAt = input.endsAt ?? existing.endsAt;
    if (endsAt <= startsAt) {
      throw badRequest(
        sessionMessagesCodes.INVALID_TIME_RANGE,
        messagesNames.sessionMessages,
      );
    }

    const data = {
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: input.status,
      meetingLink: input.meetingLink,
      notes: input.notes,
    };
    if (input.studentId !== undefined) {
      data.student = { connect: { id: input.studentId } };
    }
    if (input.subscriptionId !== undefined) {
      data.subscription = { connect: { id: input.subscriptionId } };
    }

    return sessionRepo.updateSession(id, data);
  }

  async remove(_authUser, id) {
    const existing = await sessionRepo.getById(id);
    if (!existing) throw notFound(sessionMessagesCodes.SESSION_NOT_FOUND);
    return sessionRepo.deleteSession(id);
  }

  async setPlan(authUser, id, input) {
    const existing = await sessionRepo.getById(id);
    if (!existing) throw notFound(sessionMessagesCodes.SESSION_NOT_FOUND);

    const assignments = input.assignments ?? [];
    const homework = input.homework?.trim() || null;

    // at least one of {assignments, homework}
    if (!assignments.length && !homework) {
      throw badRequest(sessionMessagesCodes.PLAN_REQUIRED, messagesNames.sessionMessages);
    }

    if (assignments.length) {
      const surahIds = [...new Set(assignments.map((a) => a.surahId))];
      const surahs = await sessionRepo.getSurahsByIds(surahIds);
      const ayahCountById = new Map(surahs.map((s) => [s.id, s.ayahCount]));

      for (const a of assignments) {
        const max = ayahCountById.get(a.surahId);
        if (!max) throw badRequest(sessionMessagesCodes.SURAH_NOT_FOUND, messagesNames.sessionMessages);
        const from = a.fromAyah ?? null;
        const to = a.toAyah ?? null;
        // both null = whole surah (valid). Otherwise both must be set & in range.
        if (from !== null || to !== null) {
          if (from === null || to === null || from < 1 || to > max || from > to) {
            throw badRequest(sessionMessagesCodes.INVALID_AYAH_RANGE, messagesNames.sessionMessages);
          }
        }
      }
    }

    const normalized = assignments.map((a, i) => ({
      kind: a.kind,
      surahId: a.surahId,
      fromAyah: a.fromAyah ?? null,
      toAyah: a.toAyah ?? null,
      order: a.order ?? i,
    }));

    return sessionRepo.setPlan(id, homework, normalized);
  }
}

export const sessionUsecase = new SessionUsecase();
