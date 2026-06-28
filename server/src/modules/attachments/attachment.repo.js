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

  /**
   * The student(s) an attachment is tied to: users using it as their avatar +
   * the students of certificates using it as their photo. Empty array means the
   * attachment is generic (not a student-private photo).
   */
  async getOwnerStudentIds(attachmentId) {
    const [avatarUsers, certPhotos] = await Promise.all([
      prisma.user.findMany({
        where: { avatarId: attachmentId },
        select: { id: true },
      }),
      prisma.certificate.findMany({
        where: { photoId: attachmentId },
        select: { studentId: true },
      }),
    ]);
    const ids = new Set();
    avatarUsers.forEach((u) => ids.add(u.id));
    certPhotos.forEach((c) => ids.add(c.studentId));
    return [...ids];
  }

  /** True if any user avatar or certificate photo still points at this attachment. */
  async isReferenced(id) {
    const [avatarCount, certCount] = await Promise.all([
      prisma.user.count({ where: { avatarId: id } }),
      prisma.certificate.count({ where: { photoId: id } }),
    ]);
    return avatarCount + certCount > 0;
  }

  deleteById(id, tx) {
    const client = tx ?? prisma;
    return client.attachment.delete({ where: { id } });
  }
}

export const attachmentRepo = new AttachmentRepo();
