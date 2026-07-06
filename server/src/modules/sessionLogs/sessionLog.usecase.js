import { NOTIFICATION_TYPES, SESSION_SUBJECTS, USER_ROLES } from "@aya/shared";
import { badRequest, forbidden, notFound } from "../../shared/errors/AppError.js";
import { userRepo } from "../users/user.repo.js";
import { notificationUsecase } from "../notifications/notification.usecase.js";
import { sessionLogRepo } from "./sessionLog.repo.js";
import { sessionLogMessagesCodes } from "./sessionLog.messages.js";

const SUBJECT_VALUES = Object.values(SESSION_SUBJECTS);

/** Parse "YYYY-MM" into a { gte, lt } UTC month range; null when malformed. */
function parseMonthRange(month) {
  if (typeof month !== "string") return null;
  const match = /^(\d{4})-(\d{2})$/.exec(month.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const gte = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const lt = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));
  if (Number.isNaN(gte.getTime()) || Number.isNaN(lt.getTime())) return null;
  return { gte, lt };
}

class SessionLogUsecase {
  /** Throws unless `authUser` may access the given session log (by its student). */
  async assertCanAccess(authUser, sessionLog) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.role === USER_ROLES.PARENT) {
      const myStudentIds = await userRepo.getStudentIdsForParent(authUser.id);
      if (myStudentIds.includes(sessionLog.studentId)) return;
    }
    throw forbidden(sessionLogMessagesCodes.CANNOT_ACCESS_SESSION_LOG);
  }

  async buildListWhere(authUser, { month, studentId }) {
    const where = {};
    const range = parseMonthRange(month);
    if (range) where.sessionDate = { gte: range.gte, lt: range.lt };

    if (authUser.role === USER_ROLES.ADMIN) {
      if (studentId) where.studentId = studentId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
      const scoped =
        studentId && studentIds.includes(studentId) ? [studentId] : studentIds;
      where.studentId = { in: scoped };
    } else {
      // Students (and any other role) are never exposed to session logs.
      where.studentId = { in: [] };
    }
    return where;
  }

  async list({ page, limit, filters = {}, authUser }) {
    const where = await this.buildListWhere(authUser, {
      month: filters.month,
      studentId: filters.studentId,
    });
    return sessionLogRepo.listSessionLogs({ where, page, limit });
  }

  async getById({ id, authUser }) {
    const sessionLog = await sessionLogRepo.findById({ id });
    if (!sessionLog) throw notFound(sessionLogMessagesCodes.SESSION_LOG_NOT_FOUND);
    await this.assertCanAccess(authUser, sessionLog);
    return sessionLog;
  }

  // ── invariant guards (beyond Zod) ─────────────────────────────
  async assertStudent(studentId) {
    const user = await userRepo.getRoleById(studentId);
    if (!user || user.role !== USER_ROLES.STUDENT) {
      throw notFound(sessionLogMessagesCodes.STUDENT_NOT_FOUND);
    }
  }

  assertSubjects(subjects) {
    if (!Array.isArray(subjects) || subjects.length === 0) {
      throw badRequest(sessionLogMessagesCodes.SUBJECTS_REQUIRED);
    }
    if (!subjects.every((s) => SUBJECT_VALUES.includes(s))) {
      throw badRequest(sessionLogMessagesCodes.INVALID_SUBJECT);
    }
  }

  /** Resolve the teacher id: validate the given admin, or fall back to the first admin. */
  async resolveTeacherId(teacherId) {
    if (teacherId !== undefined && teacherId !== null) {
      const teacher = await userRepo.getRoleById(teacherId);
      if (!teacher || teacher.role !== USER_ROLES.ADMIN) {
        throw notFound(sessionLogMessagesCodes.TEACHER_NOT_FOUND);
      }
      return teacherId;
    }
    const fallbackId = await userRepo.findFirstAdminId();
    if (!fallbackId) throw badRequest(sessionLogMessagesCodes.NO_ADMIN_AVAILABLE);
    return fallbackId;
  }

  async create({ authUser, ...input }) {
    await this.assertStudent(input.studentId);
    this.assertSubjects(input.subjects);
    const teacherId = await this.resolveTeacherId(input.teacherId);

    const data = {
      studentId: input.studentId,
      teacherId,
      subjectsJson: input.subjects,
      durationHours: input.durationHours,
      rating: input.rating ?? null,
      report: input.report ?? null,
      attendance: input.attendance,
      sessionDate: input.sessionDate,
      createdById: authUser.id,
    };

    const created = await sessionLogRepo.create({ data });

    await this.notifyParents(created);

    return created;
  }

  /** Notify the student's parent(s) that a new session was logged. Best-effort. */
  async notifyParents(sessionLog) {
    try {
      const parentIds = await userRepo.getParentIdsForStudent(sessionLog.studentId);
      if (!parentIds.length) return;

      const studentName =
        sessionLog.student?.nickname || sessionLog.student?.name || "";

      await notificationUsecase.createManyForUsers(parentIds, {
        type: NOTIFICATION_TYPES.SESSION_LOGGED,
        titleAr: "تم تسجيل حصة جديدة",
        titleEn: "A new session was logged",
        bodyAr: studentName
          ? `تم تسجيل حصة جديدة لـ ${studentName}. اضغط لعرض التفاصيل.`
          : "تم تسجيل حصة جديدة لطفلك. اضغط لعرض التفاصيل.",
        bodyEn: studentName
          ? `A new session was logged for ${studentName}. Tap to view the details.`
          : "A new session was logged for your child. Tap to view the details.",
        link: `/dashboard/session-log`,
        dataJson: { sessionLogId: sessionLog.id, studentId: sessionLog.studentId },
      });
    } catch {
      // notification failures must not break session logging
    }
  }

  async update({ id, authUser, ...input }) {
    const existing = await sessionLogRepo.findById({ id });
    if (!existing) throw notFound(sessionLogMessagesCodes.SESSION_LOG_NOT_FOUND);
    await this.assertCanAccess(authUser, existing);

    const data = {};
    if (input.studentId !== undefined) {
      await this.assertStudent(input.studentId);
      data.studentId = input.studentId;
    }
    if (input.subjects !== undefined) {
      this.assertSubjects(input.subjects);
      data.subjectsJson = input.subjects;
    }
    if (input.teacherId !== undefined) {
      data.teacherId = await this.resolveTeacherId(input.teacherId);
    }
    if (input.durationHours !== undefined) data.durationHours = input.durationHours;
    if (input.rating !== undefined) data.rating = input.rating;
    if (input.report !== undefined) data.report = input.report;
    if (input.attendance !== undefined) data.attendance = input.attendance;
    if (input.sessionDate !== undefined) data.sessionDate = input.sessionDate;

    return sessionLogRepo.update({ id, data });
  }

  async remove({ id, authUser }) {
    const existing = await sessionLogRepo.findById({ id });
    if (!existing) throw notFound(sessionLogMessagesCodes.SESSION_LOG_NOT_FOUND);
    await this.assertCanAccess(authUser, existing);
    return sessionLogRepo.deleteSessionLog({ id });
  }
}

export const sessionLogUsecase = new SessionLogUsecase();
export { SessionLogUsecase };
