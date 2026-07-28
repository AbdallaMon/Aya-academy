import { NOTIFICATION_TYPES, USER_ROLES, reportMessagesCodes } from "@ayah/shared";
import { forbidden, notFound } from "../../../shared/errors/AppError.js";
import { userRepo } from "../../users/user.repo.js";
import { notificationUsecase } from "../../notifications/notification.usecase.js";
import { reportRepo } from "./report.repo.js";

class ReportUsecase {
  /** Throws unless `authUser` may access the given report (by its linked students). */
  async assertCanAccess(authUser, report) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    const studentIds = report.students.map((s) => s.studentId);
    if (authUser.role === USER_ROLES.STUDENT) {
      if (studentIds.includes(authUser.id)) return;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const myStudentIds = await userRepo.getStudentIdsForParent(authUser.id);
      if (studentIds.some((id) => myStudentIds.includes(id))) return;
    }
    throw forbidden(reportMessagesCodes.CANNOT_ACCESS_REPORT);
  }

  async list({ page, limit, filters = {}, authUser }) {
    // Where-building now lives in the repo (reference convention).
    return reportRepo.listScoped({ authUser, filters, page, limit });
  }

  async getById({ id, authUser }) {
    const report = await reportRepo.getById({ id });
    if (!report) throw notFound(reportMessagesCodes.REPORT_NOT_FOUND);
    await this.assertCanAccess(authUser, report);
    return report;
  }

  async create({ authUser, ...input }) {
    const report = await reportRepo.createReport({
      title: input.title,
      body: input.body,
      reportDate: input.reportDate ?? new Date(),
      createdById: authUser.id,
      studentIds: input.studentIds,
      attachmentIds: input.attachmentIds,
    });

    await this.notifyRecipients(report, input.studentIds);

    return report;
  }

  /** Notify target students + their parents that a report was received. */
  async notifyRecipients(report, studentIds) {
    try {
      const parentIds = await reportRepo.getParentIdsForStudents({ studentIds });
      const recipientIds = [...new Set([...studentIds, ...parentIds])];
      if (!recipientIds.length) return;
      await notificationUsecase.createManyForUsers(recipientIds, {
        type: NOTIFICATION_TYPES.REPORT_RECEIVED,
        titleAr: report.title,
        titleEn: report.title,
        bodyAr: "وصلك تقرير جديد. اضغط لعرض التفاصيل.",
        bodyEn: "You have a new report. Tap to view the details.",
        link: `/dashboard/reports/${report.id}`,
        dataJson: { reportId: report.id },
      });
    } catch {
      // notification failures must not break report creation
    }
  }

  async update({ id, authUser, ...input }) {
    const existing = await reportRepo.getById({ id });
    if (!existing) throw notFound(reportMessagesCodes.REPORT_NOT_FOUND);

    const data = {
      title: input.title,
      body: input.body,
      reportDate: input.reportDate,
    };

    return reportRepo.updateReport({
      id,
      data,
      studentIds: input.studentIds,
      attachmentIds: input.attachmentIds,
    });
  }

  async remove({ id, authUser }) {
    const existing = await reportRepo.getById({ id });
    if (!existing) throw notFound(reportMessagesCodes.REPORT_NOT_FOUND);
    return reportRepo.deleteReport({ id });
  }
}

export const reportUsecase = new ReportUsecase();
export { ReportUsecase };
