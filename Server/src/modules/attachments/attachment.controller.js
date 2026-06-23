import { created } from "../../shared/http/response.js";
import { attachmentUsecase } from "./attachment.usecase.js";

class AttachmentController {
  upload = async (req, res) => {
    const attachment = await attachmentUsecase.upload(req.auth, req.file, {
      ownerType: req.body?.ownerType,
    });
    return created(res, attachment);
  };
}

export const attachmentController = new AttachmentController();
