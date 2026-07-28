// ===========================================================================
// encryptionKeys.repo — Prisma I/O only for the EncryptionKey table. No business
// logic, no AppError.
//
// We never store the key material here — only metadata (name/account/Drive
// file/fingerprint/primary). The material lives on Drive only.
// ===========================================================================

import { prisma } from "@ayah/db/prisma.client.js";

class EncryptionKeysRepo {
  list({ client } = {}) {
    return (client ?? prisma).encryptionKey.findMany({
      orderBy: { createdAt: "desc" },
      include: { keyAccount: true },
    });
  }

  findById({ id, client }) {
    return (client ?? prisma).encryptionKey.findUnique({
      where: { id },
      include: { keyAccount: true },
    });
  }

  findPrimary({ client } = {}) {
    return (client ?? prisma).encryptionKey.findFirst({
      where: { isPrimary: true },
      include: { keyAccount: true },
    });
  }

  count({ client } = {}) {
    return (client ?? prisma).encryptionKey.count();
  }

  /** Count of keys linked to a given KEY account (for account-type locking). */
  countByAccount({ accountId, client }) {
    return (client ?? prisma).encryptionKey.count({ where: { keyAccountId: accountId } });
  }

  create({ data, client }) {
    return (client ?? prisma).encryptionKey.create({ data });
  }

  delete({ id, client }) {
    return (client ?? prisma).encryptionKey.delete({ where: { id } });
  }

  /** Clears isPrimary for all, then sets it for one key (inside a tx from the usecase). */
  async setPrimary({ id, client }) {
    const db = client ?? prisma;
    await db.encryptionKey.updateMany({ data: { isPrimary: false } });
    return db.encryptionKey.update({ where: { id }, data: { isPrimary: true } });
  }
}

export const encryptionKeysRepo = new EncryptionKeysRepo();
export { EncryptionKeysRepo };
