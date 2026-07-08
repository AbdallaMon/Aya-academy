// ===========================================================================
// certificateTemplate.repo — Prisma I/O only on CertificateTemplate. (Reference
// idiom: single object args with optional `client`, list owns filtering +
// pagination and returns { items, total, page, pageSize }.)
// ===========================================================================

import { CERTIFICATE_TEMPLATE_TYPES } from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../../shared/utility/pagination.js";
import { buildIsActiveFilter } from "../../../shared/utility/queryBuilders.js";
import { certificateTemplateSelect } from "./certificateTemplate.dto.js";

class CertificateTemplateRepo {
  async list({ page, limit, isActive, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const where = {};
    const activeFilter = buildIsActiveFilter({ isActive });
    if (activeFilter !== undefined) where.isActive = activeFilter;

    const [items, total] = await Promise.all([
      db.certificateTemplate.findMany({
        where,
        skip,
        take,
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: certificateTemplateSelect,
      }),
      db.certificateTemplate.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).certificateTemplate.findUnique({
      where: { id },
      select: certificateTemplateSelect,
    });
  }

  /** The active template of an auto-applied type (GAME / EXAM), if any. */
  getActiveTemplateOfType({ type, client } = {}) {
    return (client ?? prisma).certificateTemplate.findFirst({
      where: { type, isActive: true },
      orderBy: { updatedAt: "desc" },
      select: certificateTemplateSelect,
    });
  }

  /** The active GAME template auto-applied to game certificates (if any). */
  getActiveGameTemplate({ client } = {}) {
    return this.getActiveTemplateOfType({
      type: CERTIFICATE_TEMPLATE_TYPES.GAME,
      client,
    });
  }

  /** The active EXAM template auto-applied to quiz certificates (if any). */
  getActiveExamTemplate({ client } = {}) {
    return this.getActiveTemplateOfType({
      type: CERTIFICATE_TEMPLATE_TYPES.EXAM,
      client,
    });
  }

  create({ data, client } = {}) {
    return (client ?? prisma).certificateTemplate.create({
      data,
      select: certificateTemplateSelect,
    });
  }

  update({ id, data, client } = {}) {
    return (client ?? prisma).certificateTemplate.update({
      where: { id },
      data,
      select: certificateTemplateSelect,
    });
  }

  remove({ id, client } = {}) {
    return (client ?? prisma).certificateTemplate.delete({
      where: { id },
      select: certificateTemplateSelect,
    });
  }

  /** Clear isDefault on every other template (used when promoting a new default). */
  unsetDefaults({ exceptId, client } = {}) {
    const where = { isDefault: true };
    if (exceptId) where.id = { not: exceptId };
    return (client ?? prisma).certificateTemplate.updateMany({
      where,
      data: { isDefault: false },
    });
  }

  /**
   * Deactivate every other active template of the SAME auto-applied type
   * (GAME / EXAM) — only one of each type may be "in use" at a time. Other
   * templates keep their type; they just stop being the active one.
   */
  deactivateOthersOfType({ type, exceptId, client } = {}) {
    const where = { type, isActive: true };
    if (exceptId) where.id = { not: exceptId };
    return (client ?? prisma).certificateTemplate.updateMany({
      where,
      data: { isActive: false },
    });
  }
}

export const certificateTemplateRepo = new CertificateTemplateRepo();
export { CertificateTemplateRepo };
