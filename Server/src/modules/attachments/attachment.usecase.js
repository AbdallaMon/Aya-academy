import { ATTACHMENT_OWNER_TYPES, messagesNames } from "@aya/shared";
import { AppError } from "../../shared/errors/AppError.js";
import { attachmentRepo } from "./attachment.repo.js";
import { attachmentMessagesCodes } from "./attachment.messages.js";
import { UPLOAD_URL_PREFIX } from "./storage.js";

class AttachmentUsecase {
  /**
   * Persist an uploaded image as an Attachment row. The file is already on disk
   * (multer); we record its public URL + storage key + metadata.
   */
  async upload(authUser, file, { ownerType } = {}) {
    if (!file) {
      throw new AppError({
        statusCode: 422,
        code: attachmentMessagesCodes.NO_FILE,
        translationKey: messagesNames.attachmentMessages,
      });
    }

    return attachmentRepo.create({
      url: `${UPLOAD_URL_PREFIX}/${file.filename}`,
      storageKey: file.filename,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      ownerType: ownerType ?? ATTACHMENT_OWNER_TYPES.GENERIC,
      uploadedById: authUser.id,
    });
  }
}

export const attachmentUsecase = new AttachmentUsecase();
