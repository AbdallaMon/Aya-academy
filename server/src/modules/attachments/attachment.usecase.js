import fs from "fs";
import path from "path";
import {
  ATTACHMENT_OWNER_TYPES,
  USER_ROLES,
  attachmentMessagesCodes,
  messagesNames,
} from "@aya/shared";
import { AppError, notFound } from "../../shared/errors/AppError.js";
import { attachmentRepo } from "./attachment.repo.js";
import { userRepo } from "../users/user.repo.js";
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from "./storage.js";

class AttachmentUsecase {
  /**
   * Persist an uploaded image as an Attachment row. The file is already on disk
   * (multer); we record its public URL + storage key + metadata.
   */
  async upload({ authUser, file, ownerType } = {}) {
    if (!file) {
      throw new AppError({
        statusCode: 422,
        code: attachmentMessagesCodes.NO_FILE,
        translationKey: messagesNames.attachmentMessages,
      });
    }

    return attachmentRepo.create({
      data: {
        url: `${UPLOAD_URL_PREFIX}/${file.filename}`,
        storageKey: file.filename,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        ownerType: ownerType ?? ATTACHMENT_OWNER_TYPES.GENERIC,
        uploadedById: authUser.id,
      },
    });
  }

  /**
   * Whether `authUser` may view an attachment. A student-private photo (used as
   * a user avatar or a certificate photo) is visible only to that student, their
   * parent(s), and admins. Generic attachments (no student link) are visible to
   * any authenticated user. Returns false → the caller responds 404 (so the file
   * presence isn't leaked to unauthorized users).
   */
  async canView({ authUser, attachmentId }) {
    if (authUser?.role === USER_ROLES.ADMIN) return true;
    const ownerStudentIds = await attachmentRepo.getOwnerStudentIds({ attachmentId });
    if (ownerStudentIds.length === 0) return true; // generic, not student-private
    if (ownerStudentIds.includes(authUser.id)) return true; // the student
    if (authUser?.role === USER_ROLES.PARENT) {
      for (const studentId of ownerStudentIds) {
        if (await userRepo.isStudentOfParent(authUser.id, studentId)) return true;
      }
    }
    return false;
  }

  /**
   * Resolve a stored file for an authenticated, AUTHORIZED download. Files are
   * NOT served publicly — only logged-in users reach this (route behind
   * requireAuth) and student-private photos are further scoped to the student,
   * their parents, and admins. Throws notFound for missing OR unauthorized (no
   * existence leak).
   */
  async getFile({ authUser, id }) {
    const att = await attachmentRepo.getById(id);
    if (!att || !att.storageKey) {
      throw notFound(attachmentMessagesCodes.ATTACHMENT_NOT_FOUND);
    }
    if (!(await this.canView({ authUser, attachmentId: id }))) {
      throw notFound(attachmentMessagesCodes.ATTACHMENT_NOT_FOUND);
    }
    // Guard against path traversal: only ever use the bare stored filename.
    const safeName = path.basename(att.storageKey);
    const absolutePath = path.join(UPLOAD_DIR, safeName);
    if (!fs.existsSync(absolutePath)) {
      throw notFound(attachmentMessagesCodes.ATTACHMENT_NOT_FOUND);
    }
    return { absolutePath, mimeType: att.mimeType, filename: att.filename };
  }

  /**
   * Delete an attachment's row and its underlying file IF nothing else still
   * references it (no user avatar, no certificate photo). Safe no-op when the
   * attachment is still in use or already gone. Used when an avatar is cleared
   * so orphaned private uploads don't accumulate on disk.
   */
  async deleteIfOrphaned(attachmentId) {
    if (!attachmentId) return false;
    if (await attachmentRepo.isReferenced({ id: attachmentId })) return false;
    const att = await attachmentRepo.getById(attachmentId);
    if (!att) return false;
    if (att.storageKey) {
      const safeName = path.basename(att.storageKey);
      const absolutePath = path.join(UPLOAD_DIR, safeName);
      try {
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      } catch {
        // Best-effort file cleanup — removing the row is what matters.
      }
    }
    await attachmentRepo.deleteById({ id: attachmentId });
    return true;
  }
}

export const attachmentUsecase = new AttachmentUsecase();
export { AttachmentUsecase };
