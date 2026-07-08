// backup.validation — Zod schemas for the mutating routes + filters.

import { z } from "zod";
import { BACKUP_STATUSES, DRIVE_ACCOUNT_TYPES } from "@aya/shared";

export class BackupsValidation {
  // Connect Drive: the new account type (KEY|DB, default DB) + optional reconnectId.
  static driveConnect = z.object({
    type: z.enum([DRIVE_ACCOUNT_TYPES.KEY, DRIVE_ACCOUNT_TYPES.DB]).optional(),
    reconnectId: z.coerce.number().int().positive().optional(),
  });

  static list = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    driveAccountId: z.coerce.number().int().positive().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.enum([BACKUP_STATUSES.SUCCESS, BACKUP_STATUSES.FAILED]).optional(),
    location: z.enum(["all", "local", "drive", "deleted"]).optional(),
  });

  // Manual backup: optional encryption key (auto uses the primary if absent).
  static runNow = z.object({
    encryptionKeyId: z.coerce.number().int().positive().optional(),
  });

  static restore = z.object({
    backupId: z.coerce.number().int().positive(),
    // A failed assertion flows through VALIDATION_ERROR + the field path (the
    // frontend translates it) — no raw prose.
    confirm: z.literal(true),
  });

  // Text fields for multipart (multer fills req.body before validation).
  // The key is required now (no default system key): raw base64 or a .pem wrapper
  // (decoded in the service).
  static restoreExternalCheck = z.object({
    externalKey: z.string().trim().min(1),
  });

  static restoreExternalCommit = z.object({
    token: z.string().min(1),
    confirm: z.literal(true),
  });

  static driveCallback = z.object({
    code: z.string().min(1).optional(),
    state: z.string().min(1),
    error: z.string().optional(),
  });

  static idParam = z.object({
    id: z.coerce.number().int().positive(),
  });

  // Drive accounts list filter: search (email/label, case-insensitive contains) + type (KEY|DB).
  static driveAccountsQuery = z.object({
    search: z.string().trim().min(1).optional(),
    type: z.enum([DRIVE_ACCOUNT_TYPES.KEY, DRIVE_ACCOUNT_TYPES.DB]).optional(),
  });
}
