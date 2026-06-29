// ===========================================================================
// backups.repo — Prisma I/O only for the Backup table. No business logic, no
// AppError. (DriveAccount lives in the separate driveAccounts.repo.js.)
//
// Reference idiom: single object args with optional `client` (`client ?? prisma`),
// and `list` owns pagination and returns { items, total, page, pageSize }.
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";

class BackupsRepo {
  create({ data, client } = {}) {
    return (client ?? prisma).backup.create({ data });
  }

  update({ id, data, client } = {}) {
    return (client ?? prisma).backup.update({ where: { id }, data });
  }

  findById({ id, client } = {}) {
    return (client ?? prisma).backup.findUnique({
      where: { id },
      include: { encryptionKey: { include: { keyAccount: true } } },
    });
  }

  /** Delete a backup row (after best-effort file deletion in the usecase). */
  delete({ id, client } = {}) {
    return (client ?? prisma).backup.delete({ where: { id } });
  }

  /** Paginated list. `where` is optional (built in the usecase from account/dates/status). */
  async list({ page, limit, where = {}, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    const [items, total] = await Promise.all([
      db.backup.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        // Include the encryption key + its account to compute canRestore per row
        // (which needs both accounts' connection state).
        include: { encryptionKey: { include: { keyAccount: true } } },
      }),
      db.backup.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  /** All backup rows (snapshot before restore). No filter. */
  findAll({ client } = {}) {
    return (client ?? prisma).backup.findMany({ orderBy: { id: "asc" } });
  }

  /** A backup row by fileName (to check survival after restore). */
  findByFileName({ fileName, client } = {}) {
    return (client ?? prisma).backup.findFirst({ where: { fileName } });
  }

  /** Re-insert backup rows dropped by the restore — one at a time to isolate failures. */
  async reinsertMany({ rows, client } = {}) {
    const db = client ?? prisma;
    let restored = 0;
    for (const r of rows) {
      try {
        await db.backup.create({ data: r });
        restored += 1;
      } catch {
        /* row exists / conflict — skip and continue */
      }
    }
    return restored;
  }

  /** The last successful backup (to display its time in the status panel). */
  lastSuccessful({ client } = {}) {
    return (client ?? prisma).backup.findFirst({
      where: { status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Successful backups beyond the local retention limit (oldest) whose file is not yet deleted. */
  findStaleLocal({ keep, client } = {}) {
    return (client ?? prisma).backup.findMany({
      where: { status: "SUCCESS", localDeletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: keep,
    });
  }

  /** Successful backups beyond the Drive retention limit that still have a file not yet deleted. */
  findStaleDrive({ keep, client } = {}) {
    return (client ?? prisma).backup.findMany({
      where: { status: "SUCCESS", driveFileId: { not: null }, driveDeletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: keep,
    });
  }

  /** Count of backups linked to a given Drive account (to block deleting an account with backups). */
  countByAccount({ accountId, client } = {}) {
    return (client ?? prisma).backup.count({ where: { driveAccountId: accountId } });
  }

  /**
   * The current schema from information_schema (to compare with an external dump).
   * The only place that reads information_schema — kept in the repo (Prisma-only).
   * Excludes `_prisma_migrations` to match extractSchemaFromSql.
   * @returns {Promise<Map<string, Set<string>>>}
   */
  async getCurrentSchema({ client } = {}) {
    const rows = await (client ?? prisma).$queryRaw`
      SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
    `;
    const schema = new Map();
    for (const r of rows) {
      const table = r.tableName;
      const column = r.columnName;
      if (table === "_prisma_migrations") continue;
      if (!schema.has(table)) schema.set(table, new Set());
      schema.get(table).add(column);
    }
    return schema;
  }
}

export const backupsRepo = new BackupsRepo();
export { BackupsRepo };
