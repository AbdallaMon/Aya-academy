import { prisma } from "@aya/db/prisma.client.js";
import { reportListSelect, reportSelect } from "./report.dto.js";

class ReportRepo {
  async listReports(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { reportDate: "desc" },
        select: reportListSelect,
      }),
      prisma.report.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.report.findUnique({ where: { id }, select: reportSelect });
  }

  createReport({ title, body, reportDate, createdById, studentIds, attachmentIds }) {
    return prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: { title, body, reportDate, createdById },
        select: { id: true },
      });
      if (studentIds?.length) {
        await tx.reportStudent.createMany({
          data: studentIds.map((studentId) => ({
            reportId: report.id,
            studentId,
          })),
        });
      }
      if (attachmentIds?.length) {
        await tx.reportAttachment.createMany({
          data: attachmentIds.map((attachmentId) => ({
            reportId: report.id,
            attachmentId,
          })),
        });
      }
      return tx.report.findUnique({
        where: { id: report.id },
        select: reportSelect,
      });
    });
  }

  updateReport(id, { data, studentIds, attachmentIds }) {
    return prisma.$transaction(async (tx) => {
      await tx.report.update({ where: { id }, data });
      if (studentIds !== undefined) {
        await tx.reportStudent.deleteMany({ where: { reportId: id } });
        if (studentIds.length) {
          await tx.reportStudent.createMany({
            data: studentIds.map((studentId) => ({ reportId: id, studentId })),
          });
        }
      }
      if (attachmentIds !== undefined) {
        await tx.reportAttachment.deleteMany({ where: { reportId: id } });
        if (attachmentIds.length) {
          await tx.reportAttachment.createMany({
            data: attachmentIds.map((attachmentId) => ({
              reportId: id,
              attachmentId,
            })),
          });
        }
      }
      return tx.report.findUnique({ where: { id }, select: reportSelect });
    });
  }

  deleteReport(id) {
    return prisma.report.delete({ where: { id }, select: { id: true } });
  }

  async getParentIdsForStudents(studentIds) {
    const links = await prisma.parentStudent.findMany({
      where: { studentId: { in: studentIds } },
      select: { parentId: true },
    });
    return links.map((l) => l.parentId);
  }
}

export const reportRepo = new ReportRepo();
