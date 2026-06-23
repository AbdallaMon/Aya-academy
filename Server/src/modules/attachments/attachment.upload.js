// ===========================================================================
// attachment.upload — multer for local-disk IMAGE uploads (avatars, photos).
//
// Files are stored under UPLOAD_DIR with a collision-safe name. Only image mime
// types (png/jpeg/jpg/webp/gif) are accepted, max ~5MB. multer errors are mapped
// to language-neutral codes from @aya/shared.
//
// multer v2 (Aya): the diskStorage/single/fileFilter API used here is unchanged
// from v1, so this is compatible.
// ===========================================================================

import path from "path";
import crypto from "crypto";
import multer from "multer";
import { AppError } from "../../shared/errors/AppError.js";
import { attachmentMessagesCodes, messagesNames } from "@aya/shared";
import { UPLOAD_DIR } from "./storage.js";

const TK = messagesNames.attachmentMessages;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// Allowed image types → canonical extension.
const ALLOWED_MIME = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    // Prefer the canonical extension for the accepted mime; fall back to the
    // original extension (already validated as an image by fileFilter).
    const ext =
      ALLOWED_MIME[file.mimetype] ||
      (path.extname(file.originalname || "") || "").toLowerCase() ||
      ".bin";
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME[file.mimetype]) {
    return cb(
      new AppError({
        statusCode: 422,
        code: attachmentMessagesCodes.UNSUPPORTED_TYPE,
        translationKey: TK,
      }),
    );
  }
  return cb(null, true);
}

const imageMulter = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter,
});

/** middleware: accepts a single "file" field and maps multer errors to codes. */
export function uploadImageFile(req, res, next) {
  imageMulter.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof AppError) return next(err);
      if (err && err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError({
            statusCode: 422,
            code: attachmentMessagesCodes.FILE_TOO_LARGE,
            translationKey: TK,
          }),
        );
      }
      return next(
        new AppError({
          statusCode: 422,
          code: attachmentMessagesCodes.UPLOAD_FAILED,
          translationKey: TK,
        }),
      );
    }
    return next();
  });
}

export { MAX_BYTES };
