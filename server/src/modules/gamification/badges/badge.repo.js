// ===========================================================================
// badge.repo — Prisma I/O only on Badge / StudentBadge. (Reference idiom:
// single object args with optional `client`, list owns filtering + pagination
// and returns { items, total, page, pageSize }.)
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../../shared/utility/pagination.js";
import { buildSearchQuery } from "../../../shared/utility/queryBuilders.js";
import { badgeSelect, studentBadgeSelect } from "./badge.dto.js";

class BadgeRepo {
  // ── badge definitions ────────────────────────────────────────
  async list({ page, limit, search, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const where = {};
    const searchWhere = buildSearchQuery({
      searchType: "multiKeySearch",
      keysValues: [
        { key: "nameAr", value: search },
        { key: "nameEn", value: search },
        { key: "code", value: search },
      ],
    });
    if (searchWhere.OR) where.OR = searchWhere.OR;

    const [items, total] = await Promise.all([
      db.badge.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: badgeSelect,
      }),
      db.badge.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).badge.findUnique({ where: { id }, select: badgeSelect });
  }

  create({ data, client } = {}) {
    return (client ?? prisma).badge.create({ data, select: badgeSelect });
  }

  update({ id, data, client } = {}) {
    return (client ?? prisma).badge.update({ where: { id }, data, select: badgeSelect });
  }

  remove({ id, client } = {}) {
    return (client ?? prisma).badge.delete({ where: { id }, select: badgeSelect });
  }

  // ── student ↔ badge awards ───────────────────────────────────
  /** Award a badge to a student (optionally inside a tx). */
  createStudentBadge({ data, client } = {}) {
    return (client ?? prisma).studentBadge.create({ data, select: studentBadgeSelect });
  }

  /** Find a specific student's award of a badge. */
  findStudentBadge({ studentId, badgeId, client } = {}) {
    return (client ?? prisma).studentBadge.findUnique({
      where: { studentId_badgeId: { studentId, badgeId } },
      select: studentBadgeSelect,
    });
  }

  /** Remove a student's award of a badge (optionally inside a tx). */
  deleteStudentBadge({ id, client } = {}) {
    return (client ?? prisma).studentBadge.delete({ where: { id } });
  }

  /** A student's awarded badges (with their definitions), newest first. */
  listStudentBadges({ studentId, client } = {}) {
    return (client ?? prisma).studentBadge.findMany({
      where: { studentId },
      orderBy: { awardedAt: "desc" },
      select: studentBadgeSelect,
    });
  }
}

export const badgeRepo = new BadgeRepo();
export { BadgeRepo };
