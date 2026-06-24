import { created } from "../../shared/http/response.js";
import { attachmentUsecase } from "./attachment.usecase.js";

class AttachmentController {
  upload = async (req, res) => {
    const attachment = await attachmentUsecase.upload(req.auth, req.file, {
      ownerType: req.body?.ownerType,
    });
    return created(res, attachment);
  };

  // Stream a stored file to an authorized user (route is behind requireAuth;
  // student-private photos are further scoped in the usecase).
  raw = async (req, res) => {
    const { absolutePath, mimeType } = await attachmentUsecase.getFile(
      req.auth,
      Number(req.params.id),
    );
    if (mimeType) res.type(mimeType);
    // Private: cacheable by the user's browser only, not shared proxies.
    res.setHeader("Cache-Control", "private, max-age=86400");
    return res.sendFile(absolutePath);
  };
}

export const attachmentController = new AttachmentController();
