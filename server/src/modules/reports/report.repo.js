// ===========================================================================
// report.repo — Prisma I/O only on Report / ReportStudent / ReportAttachment.
// (Reference idiom: single object args with optional `client`, list owns
// pagination and returns { items, total, page, pageSize }.)
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";
import { reportListSelect, reportSelect } from "./report.dto.js";

class ReportRepo {
  async listReports({ where = {}, page, limit, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const [items, total] = await Promise.all([
      db.report.findMany({
        where,
        skip,
        take,
        orderBy: { reportDate: "desc" },
        select: reportListSelect,
      }),
      db.report.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).report.findUnique({
      where: { id },
      select: reportSelect,
    });
  }

  createReport({ title, body, reportDate, createdById, studentIds, attachmentIds, client } = {}) {
    const run = async (tx) => {
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
    };
    return client ? run(client) : prisma.$transaction(run);
  }

  updateReport({ id, data, studentIds, attachmentIds, client } = {}) {
    const run = async (tx) => {
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
    };
    return client ? run(client) : prisma.$transaction(run);
  }

  deleteReport({ id, client } = {}) {
    return (client ?? prisma).report.delete({
      where: { id },
      select: { id: true },
    });
  }

  async getParentIdsForStudents({ studentIds, client } = {}) {
    const links = await (client ?? prisma).parentStudent.findMany({
      where: { studentId: { in: studentIds } },
      select: { parentId: true },
    });
    return links.map((l) => l.parentId);
  }
}

export const reportRepo = new ReportRepo();
export { ReportRepo };
