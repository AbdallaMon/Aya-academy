// ===========================================================================
// backups.upload — multer for the external-restore .enc upload.
//
// The file is stored in os.tmpdir() (not under uploads). Only the .enc extension
// is accepted. Size limit 200MB. multer errors are mapped to language-neutral
// codes. The usecase deletes the temp file after the check.
//
// multer v2 (Ayah): the diskStorage/single/fileFilter API used here is unchanged
// from v1, so this is compatible.
// ===========================================================================

import os from "os";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { AppError } from "../../shared/errors/AppError.js";
import { backupMessagesCodes, messagesNames } from "@ayah/shared";

const TK = messagesNames.backupMessages;
const MAX_BYTES = 200 * 1024 * 1024; // 200MB
const TMP_DIR = os.tmpdir();

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, TMP_DIR);
  },
  filename(_req, _file, cb) {
    const name = `restore-${Date.now()}-${crypto.randomBytes(8).toString("hex")}.enc`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  const ext = (path.extname(file.originalname || "") || "").toLowerCase();
  if (ext !== ".enc") {
    return cb(new AppError({ statusCode: 422, code: backupMessagesCodes.EXTERNAL_FILE_INVALID_TYPE, translationKey: TK }));
  }
  return cb(null, true);
}

const restoreMulter = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter,
});

/** middleware: accepts a single "file" field and maps multer errors to language-neutral codes. */
export function uploadRestoreFile(req, res, next) {
  restoreMulter.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof AppError) return next(err);
      if (err && err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError({ statusCode: 422, code: backupMessagesCodes.EXTERNAL_FILE_TOO_LARGE, translationKey: TK }));
      }
      return next(new AppError({ statusCode: 422, code: backupMessagesCodes.EXTERNAL_FILE_INVALID_TYPE, translationKey: TK }));
    }
    return next();
  });
}

export { MAX_BYTES, TMP_DIR };
