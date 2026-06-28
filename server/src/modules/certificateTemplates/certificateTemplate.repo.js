import { CERTIFICATE_TEMPLATE_TYPES } from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import { certificateTemplateSelect } from "./certificateTemplate.dto.js";

class CertificateTemplateRepo {
  async list(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.certificateTemplate.findMany({
        where,
        skip,
        take,
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: certificateTemplateSelect,
      }),
      prisma.certificateTemplate.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.certificateTemplate.findUnique({
      where: { id },
      select: certificateTemplateSelect,
    });
  }

  /** The active template of an auto-applied type (GAME / EXAM), if any. */
  getActiveTemplateOfType(type, tx) {
    return (tx ?? prisma).certificateTemplate.findFirst({
      where: { type, isActive: true },
      orderBy: { updatedAt: "desc" },
      select: certificateTemplateSelect,
    });
  }

  /** The active GAME template auto-applied to game certificates (if any). */
  getActiveGameTemplate(tx) {
    return this.getActiveTemplateOfType(CERTIFICATE_TEMPLATE_TYPES.GAME, tx);
  }

  /** The active EXAM template auto-applied to quiz certificates (if any). */
  getActiveExamTemplate(tx) {
    return this.getActiveTemplateOfType(CERTIFICATE_TEMPLATE_TYPES.EXAM, tx);
  }

  create(data, tx) {
    return (tx ?? prisma).certificateTemplate.create({
      data,
      select: certificateTemplateSelect,
    });
  }

  update(id, data, tx) {
    return (tx ?? prisma).certificateTemplate.update({
      where: { id },
      data,
      select: certificateTemplateSelect,
    });
  }

  remove(id) {
    return prisma.certificateTemplate.delete({
      where: { id },
      select: certificateTemplateSelect,
    });
  }

  /** Clear isDefault on every other template (used when promoting a new default). */
  unsetDefaults(exceptId, tx) {
    const where = { isDefault: true };
    if (exceptId) where.id = { not: exceptId };
    return (tx ?? prisma).certificateTemplate.updateMany({
      where,
      data: { isDefault: false },
    });
  }

  /**
   * Deactivate every other active template of the SAME auto-applied type
   * (GAME / EXAM) — only one of each type may be "in use" at a time. Other
   * templates keep their type; they just stop being the active one.
   */
  deactivateOthersOfType(type, exceptId, tx) {
    const where = { type, isActive: true };
    if (exceptId) where.id = { not: exceptId };
    return (tx ?? prisma).certificateTemplate.updateMany({
      where,
      data: { isActive: false },
    });
  }
}

export const certificateTemplateRepo = new CertificateTemplateRepo();
