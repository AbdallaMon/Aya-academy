// ===========================================================================
// attachment.repo — Prisma I/O only on Attachment (joined against User.avatarId
// and Certificate.photoId for reference checks). (Reference idiom: single object
// args with optional `client`.) NOTE: `getById(id)` keeps a positional signature
// — it is called cross-module (users) and that call shape is frozen.
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { attachmentSelect } from "./attachment.dto.js";

class AttachmentRepo {
  create({ data, client } = {}) {
    return (client ?? prisma).attachment.create({ data, select: attachmentSelect });
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
  async getOwnerStudentIds({ attachmentId, client } = {}) {
    const db = client ?? prisma;
    const [avatarUsers, certPhotos] = await Promise.all([
      db.user.findMany({
        where: { avatarId: attachmentId },
        select: { id: true },
      }),
      db.certificate.findMany({
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
  async isReferenced({ id, client } = {}) {
    const db = client ?? prisma;
    const [avatarCount, certCount] = await Promise.all([
      db.user.count({ where: { avatarId: id } }),
      db.certificate.count({ where: { photoId: id } }),
    ]);
    return avatarCount + certCount > 0;
  }

  deleteById({ id, client } = {}) {
    return (client ?? prisma).attachment.delete({ where: { id } });
  }
}

export const attachmentRepo = new AttachmentRepo();
export { AttachmentRepo };
