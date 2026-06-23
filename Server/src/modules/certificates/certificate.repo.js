import { prisma } from "@aya/db/prisma.client.js";
import { certificateSelect } from "./certificate.dto.js";

class CertificateRepo {
  async list(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip,
        take,
        orderBy: { issuedAt: "desc" },
        select: certificateSelect,
      }),
      prisma.certificate.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.certificate.findUnique({
      where: { id },
      select: certificateSelect,
    });
  }

  create(data, tx) {
    const client = tx ?? prisma;
    return client.certificate.create({ data, select: certificateSelect });
  }
}

export const certificateRepo = new CertificateRepo();
