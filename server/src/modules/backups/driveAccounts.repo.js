// ===========================================================================
// driveAccounts.repo — Prisma I/O only for the DriveAccount table. No business
// logic, no AppError.
//
// Separate from backups.repo so the drive provider can import it without pulling
// in Backup logic.
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";

class DriveAccountsRepo {
  /**
   * List Drive accounts with optional filters.
   * @param {object} params
   * @param {string} [params.search]  contains in email or label (case-insensitive — table collation).
   * @param {string} [params.type]    KEY | DB.
   */
  list({ filters = {}, client } = {}) {
    const where = {};
    if (filters.type) where.type = filters.type;
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search } },
        { label: { contains: filters.search } },
      ];
    }
    return (client ?? prisma).driveAccount.findMany({ where, orderBy: { createdAt: "asc" } });
  }

  findById({ id, client }) {
    return (client ?? prisma).driveAccount.findUnique({ where: { id } });
  }

  findActive({ client } = {}) {
    return (client ?? prisma).driveAccount.findFirst({ where: { isActive: true } });
  }

  findByGoogleUserId({ googleUserId, client }) {
    if (!googleUserId) return Promise.resolve(null);
    return (client ?? prisma).driveAccount.findFirst({ where: { googleUserId } });
  }

  findByEmail({ email, client }) {
    if (!email) return Promise.resolve(null);
    return (client ?? prisma).driveAccount.findFirst({ where: { email } });
  }

  /** All account rows (snapshot before restore, with their encrypted tokens). */
  findAll({ client } = {}) {
    return (client ?? prisma).driveAccount.findMany({ orderBy: { id: "asc" } });
  }

  async reinsertMany({ rows, client }) {
    const db = client ?? prisma;
    let restored = 0;
    for (const r of rows) {
      try {
        await db.driveAccount.create({ data: r });
        restored += 1;
      } catch {
        /* row exists / conflict — skip and continue */
      }
    }
    return restored;
  }

  create({ data, client }) {
    return (client ?? prisma).driveAccount.create({ data });
  }

  update({ id, data, client }) {
    return (client ?? prisma).driveAccount.update({ where: { id }, data });
  }

  /** Makes exactly one account active (clears all, then activates the target). */
  async setActive({ id, client }) {
    const run = async (tx) => {
      await tx.driveAccount.updateMany({ data: { isActive: false } });
      return tx.driveAccount.update({ where: { id }, data: { isActive: true } });
    };
    if (client) return run(client);
    return prisma.$transaction(run);
  }

  delete({ id, client }) {
    return (client ?? prisma).driveAccount.delete({ where: { id } });
  }

  countBackups({ accountId, client }) {
    return (client ?? prisma).backup.count({ where: { driveAccountId: accountId } });
  }
}

export const driveAccountsRepo = new DriveAccountsRepo();
export { DriveAccountsRepo };
