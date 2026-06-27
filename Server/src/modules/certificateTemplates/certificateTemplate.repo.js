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

  /** The single active GAME template auto-applied to game certificates (if any). */
  getActiveGameTemplate(tx) {
    return (tx ?? prisma).certificateTemplate.findFirst({
      where: { type: CERTIFICATE_TEMPLATE_TYPES.GAME, isActive: true },
      orderBy: { updatedAt: "desc" },
      select: certificateTemplateSelect,
    });
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
   * Demote every other GAME template back to GENERAL — only one GAME template
   * may exist at a time (used when promoting a new game template).
   */
  demoteOtherGameTemplates(exceptId, tx) {
    const where = { type: CERTIFICATE_TEMPLATE_TYPES.GAME };
    if (exceptId) where.id = { not: exceptId };
    return (tx ?? prisma).certificateTemplate.updateMany({
      where,
      data: { type: CERTIFICATE_TEMPLATE_TYPES.GENERAL },
    });
  }
}

export const certificateTemplateRepo = new CertificateTemplateRepo();
