// ===========================================================================
// whiteboardImage.storage — local-disk storage + multer for board images.
//
// Board images live in their OWN subfolder of UPLOAD_DIR so the retention cron /
// session delete can reclaim them without touching other attachments. Only image
// mimes, max ~8MB (boards can hold photos). multer errors map to codes.
// ===========================================================================

import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { AppError } from "../../shared/errors/AppError.js";
import { attachmentMessagesCodes, messagesNames } from "@aya/shared";
import { UPLOAD_DIR } from "./storage.js";

const TK = messagesNames.attachmentMessages;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/** Absolute directory for whiteboard images (a subfolder of UPLOAD_DIR). */
export const WHITEBOARD_UPLOAD_DIR = path.join(UPLOAD_DIR, "whiteboard");
fs.mkdirSync(WHITEBOARD_UPLOAD_DIR, { recursive: true });

/** Resolve the absolute path of a stored whiteboard image (traversal-safe). */
export function whiteboardImagePath(storageKey) {
  return path.join(WHITEBOARD_UPLOAD_DIR, path.basename(storageKey));
}

// Raster formats only. SVG is deliberately EXCLUDED: it can carry inline scripts
// and the serve route is public, so an inline SVG would be stored XSS.
const ALLOWED_MIME = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, WHITEBOARD_UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext =
      ALLOWED_MIME[file.mimetype] ||
      (path.extname(file.originalname || "") || "").toLowerCase() ||
      ".bin";
    // Long random key = an unguessable capability segment in the serve URL.
    const name = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${ext}`;
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

const imageMulter = multer({ storage, limits: { fileSize: MAX_BYTES, files: 1 }, fileFilter });

/** middleware: accepts a single "file" field, mapping multer errors to codes. */
export function uploadWhiteboardImage(req, res, next) {
  imageMulter.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof AppError) return next(err);
    const code =
      err.code === "LIMIT_FILE_SIZE"
        ? attachmentMessagesCodes.FILE_TOO_LARGE
        : attachmentMessagesCodes.UPLOAD_FAILED;
    return next(new AppError({ statusCode: 422, code, translationKey: TK }));
  });
}
