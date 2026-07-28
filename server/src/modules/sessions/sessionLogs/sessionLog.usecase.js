import {
  NOTIFICATION_TYPES,
  SESSION_SUBJECTS,
  USER_ROLES,
  sessionLogMessagesCodes,
} from "@ayah/shared";
import { badRequest, forbidden, notFound } from "../../../shared/errors/AppError.js";
import { minutesFromHours } from "../../../shared/utility/duration.js";
import { userRepo } from "../../users/user.repo.js";
import { notificationUsecase } from "../../notifications/notification.usecase.js";
import { subscriptionUsecase } from "../../finance/subscriptions/subscription.usecase.js";
import { sessionLogRepo } from "./sessionLog.repo.js";

const SUBJECT_VALUES = Object.values(SESSION_SUBJECTS);

/**
 * Best-effort: recompute-and-store the open USAGE bill for the month a session
 * belongs to. Swallows every error — billing sync must NEVER fail the session
 * logging it hangs off of.
 */
async function syncUsageBill(studentId, sessionDate) {
  try {
    await subscriptionUsecase.recomputeOpenUsageSubscription({
      studentId,
      sessionDate,
    });
  } catch (error) {
    console.error("[usage-billing-sync] session synchronization failed", {
      studentId,
      sessionDate,
      code: error?.code,
      message: error?.message,
    });
    // swallow — billing sync must never fail session logging
  }
}

/** True when two dates fall in the same UTC year+month (same billing bucket). */
function sameUtcMonth(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth()
  );
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

  async list({ page, limit, filters = {}, authUser }) {
    // Where-building now lives in the repo (reference convention).
    return sessionLogRepo.listScoped({ authUser, filters, page, limit });
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

    const durationMinutes =
      input.durationMinutes ?? minutesFromHours(input.durationHours);
    const data = {
      studentId: input.studentId,
      teacherId,
      subjectsJson: input.subjects,
      durationMinutes,
      rating: input.rating ?? null,
      report: input.report ?? null,
      attendance: input.attendance,
      sessionDate: input.sessionDate,
      createdById: authUser.id,
    };

    const created = await sessionLogRepo.create({ data });

    // Recompute-and-store the accumulating next-month USAGE bill (best-effort).
    await syncUsageBill(created.studentId, created.sessionDate);

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
    if (input.durationMinutes !== undefined || input.durationHours !== undefined) {
      data.durationMinutes =
        input.durationMinutes ?? minutesFromHours(input.durationHours);
    }
    if (input.rating !== undefined) data.rating = input.rating;
    if (input.report !== undefined) data.report = input.report;
    if (input.attendance !== undefined) data.attendance = input.attendance;
    if (input.sessionDate !== undefined) data.sessionDate = input.sessionDate;

    const targetStudentId = data.studentId ?? existing.studentId;
    const targetSessionDate = data.sessionDate ?? existing.sessionDate;
    if (
      existing.billedSubscriptionId &&
      (targetStudentId !== existing.studentId ||
        !sameUtcMonth(targetSessionDate, existing.sessionDate))
    ) {
      // Moving a billed session to a different student/month moves ownership to
      // the new bucket; both old and new subscriptions are recomputed below.
      data.billedSubscriptionId = null;
    }

    const updated = await sessionLogRepo.update({ id, data });

    // Recompute-and-store the affected USAGE bill(s) (best-effort). Recompute-
    // from-source, so recomputing both the old and the new consumption month is
    // always safe. When the student or the month changed, sync BOTH buckets so
    // the old month sheds the moved/changed hours and the new month gains them.
    await syncUsageBill(existing.studentId, existing.sessionDate);
    if (
      updated.studentId !== existing.studentId ||
      !sameUtcMonth(updated.sessionDate, existing.sessionDate)
    ) {
      await syncUsageBill(updated.studentId, updated.sessionDate);
    }

    return updated;
  }

  async remove({ id, authUser }) {
    const existing = await sessionLogRepo.findById({ id });
    if (!existing) throw notFound(sessionLogMessagesCodes.SESSION_LOG_NOT_FOUND);
    await this.assertCanAccess(authUser, existing);

    // Load-before-delete already done (existing) — delete, then recompute the
    // removed session's month so the bill sheds its hours (best-effort).
    const result = await sessionLogRepo.deleteSessionLog({ id });
    await syncUsageBill(existing.studentId, existing.sessionDate);
    return result;
  }
}

export const sessionLogUsecase = new SessionLogUsecase();
export { SessionLogUsecase };
