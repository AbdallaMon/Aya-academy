import { prisma } from "@aya/db/prisma.client.js";
import { attachmentSelect } from "./attachment.dto.js";

class AttachmentRepo {
  create(data, tx) {
    const client = tx ?? prisma;
    return client.attachment.create({ data, select: attachmentSelect });
  }

  /** Used to validate an attachment exists before consuming it (e.g. as avatar). */
  getById(id) {
    return prisma.attachment.findUnique({
      where: { id },
      select: { ...attachmentSelect, storageKey: true },
    });
  }
}

export const attachmentRepo = new AttachmentRepo();
