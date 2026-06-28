// encryptionKeys.validation — Zod schemas for the encryption-key routes.

import { z } from "zod";

export class EncryptionKeysValidation {
  // Save a key: name + the key (base64 or .pem) + a KEY account. The 32-byte
  // assertion happens in the usecase (language-neutral ENCRYPTION_KEY_INVALID)
  // because it tolerates a .pem wrapper.
  static save = z.object({
    name: z.string().trim().min(1).max(100),
    key: z.string().min(1),
    keyAccountId: z.coerce.number().int().positive(),
  });

  static idParam = z.object({
    id: z.coerce.number().int().positive(),
  });
}
