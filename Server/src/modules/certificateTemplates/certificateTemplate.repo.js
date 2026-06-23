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
}

export const certificateTemplateRepo = new CertificateTemplateRepo();
