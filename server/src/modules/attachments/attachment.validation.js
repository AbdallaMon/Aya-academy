import { z } from "zod";
import { ATTACHMENT_OWNER_TYPES } from "@ayah/shared";

const ownerTypes = Object.values(ATTACHMENT_OWNER_TYPES);

export class AttachmentValidation {
  // Multipart body — the file itself is handled by multer; only the optional
  // ownerType text field is validated here.
  static uploadSchema = z.object({
    ownerType: z.enum(ownerTypes).optional(),
  });
}
