// ===========================================================================
// restore.js — imports a .sql file into the MySQL DB via mysql2 (pure-node).
//
// Runs the dump statements directly over a mysql2 connection with
// multipleStatements:true. Destructive: only called by backupService restore
// flows after confirm + authorization. On failure throws a language-neutral
// AppError. Never logs any secret.
// ===========================================================================

import fs from "fs";
import mysql from "mysql2/promise";
import { AppError } from "../../shared/errors/AppError.js";
import { backupMessagesCodes, messagesNames } from "@aya/shared";
import { parseDatabaseConnection } from "./dbUrl.js";

const TK = messagesNames.backupMessages;

/**
 * Imports a .sql file into the DB (replaces current content).
 * @param {string} sqlPath
 * @returns {Promise<void>}
 */
export async function importSql(sqlPath) {
  const { host, port, user, password, database } = parseDatabaseConnection();

  let sql;
  try {
    sql = fs.readFileSync(sqlPath, "utf8");
  } catch (err) {
    throw new AppError({
      statusCode: 500,
      code: backupMessagesCodes.RESTORE_FAILED,
      translationKey: TK,
      details: { stage: "read-sql", error: err?.message },
    });
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port: Number(port),
      user,
      password,
      database,
      charset: "utf8mb4",
      multipleStatements: true,
    });
  } catch (err) {
    throw new AppError({
      statusCode: 500,
      code: backupMessagesCodes.RESTORE_DB_CONNECT_FAILED,
      translationKey: TK,
      details: { stage: "connect", error: err?.code || err?.message },
    });
  }

  try {
    await connection.query(sql);
  } catch (err) {
    throw new AppError({
      statusCode: 500,
      code: backupMessagesCodes.RESTORE_FAILED,
      translationKey: TK,
      details: { stage: "import", error: err?.code || err?.message },
    });
  } finally {
    try {
      await connection.end();
    } catch {
      /* ignore close errors */
    }
  }
}
