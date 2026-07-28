// ===========================================================================
// report.repo — Prisma I/O only on Report / ReportStudent / ReportAttachment.
// (Reference idiom: single object args with optional `client`, list owns
// pagination and returns { items, total, page, pageSize }.)
// ===========================================================================

import { USER_ROLES } from "@ayah/shared";
import { prisma } from "@ayah/db/prisma.client.js";
import { paginate } from "../../../shared/utility/pagination.js";
import { buildSearchQuery } from "../../../shared/utility/queryBuilders.js";
import { userRepo } from "../../users/user.repo.js";
import { reportListSelect, reportSelect } from "./report.dto.js";

class ReportRepo {
  async buildListWhere(authUser, { search, studentId } = {}) {
    const where = {};
    const term = typeof search === "string" ? search.trim() : "";
    const searchWhere = buildSearchQuery({
      searchType: "multiKeySearch",
      keysValues: [{ key: "title", value: term || undefined }],
    });
    if (searchWhere.OR) where.OR = searchWhere.OR;

    if (authUser.role === USER_ROLES.ADMIN) {
      if (studentId) where.students = { some: { studentId } };
    } else if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
      const scoped =
        studentId && studentIds.includes(studentId) ? [studentId] : studentIds;
      where.students = { some: { studentId: { in: scoped } } };
    } else {
      where.students = { some: { studentId: authUser.id } };
    }
    return where;
  }

  // Scoped list — builds the where from (authUser, filters) then pages.
  async listScoped({ authUser, filters = {}, page, limit, client } = {}) {
    const where = await this.buildListWhere(authUser, {
      search: filters.search,
      studentId: filters.studentId,
    });
    return this.listReports({ where, page, limit, client });
  }

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
