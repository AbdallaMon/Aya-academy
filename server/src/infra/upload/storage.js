// ===========================================================================
// storage — shared local-disk upload location.
//
// Resolves the uploads directory once (env-overridable) and ensures it exists.
// Exported so the express app can statically serve the same directory and the
// usecase can resolve absolute paths for stored files.
// ===========================================================================

import fs from "fs";
import path from "path";

/** Absolute path of the directory where uploaded files are stored. */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");

// Ensure the directory exists at module load (idempotent).
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/** Public URL path prefix under which stored files are served. */
export const UPLOAD_URL_PREFIX = "/uploads";
