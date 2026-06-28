// ===========================================================================
// dump.js — produces a raw logical dump of the MySQL DB via mysql2 (pure-node).
//
// Does not depend on mysqldump or any external binary — connects via the driver
// (mysql2) and builds a self-contained, restorable .sql file (portable: works
// on Windows with no MySQL tools). Returns the path to a temp .sql file
// (backupService reads then encrypts it). UTF-8.
//
// Type handling: NULL/numbers/strings via mysql.escape; DATE/DATETIME (Date)
// via escape; JSON columns returned as valid JSON text; Buffer/binary as
// X'..hex..'.
// ===========================================================================

import fs from "fs";
import os from "os";
import path from "path";
import mysql from "mysql2/promise";
import { AppError } from "../../shared/errors/AppError.js";
import { backupMessagesCodes, messagesNames } from "@aya/shared";
import { parseDatabaseConnection } from "./dbUrl.js";

const TK = messagesNames.backupMessages;
const INSERT_CHUNK = 200;

/**
 * Creates a DB dump into a temp .sql file and returns its path.
 * @returns {Promise<string>}
 */
export async function createDump() {
  const { host, port, user, password, database } = parseDatabaseConnection();

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port: Number(port),
      user,
      password,
      database,
      charset: "utf8mb4",
      dateStrings: false,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });
  } catch (err) {
    throw connectError(err);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aya-academy-dump-"));
  const outPath = path.join(tmpDir, `${database || "db"}.sql`);
  const out = fs.createWriteStream(outPath, { encoding: "utf8" });

  const write = (s) =>
    new Promise((resolve, reject) => {
      out.write(s, "utf8", (e) => (e ? reject(e) : resolve()));
    });

  try {
    await write(
      `-- ===========================================================\n` +
        `-- Full logical dump (mysql2 pure-node dump)\n` +
        `-- Database: ${database}\n` +
        `-- Date: ${new Date().toISOString()}\n` +
        `-- ===========================================================\n\n` +
        `SET NAMES utf8mb4;\n` +
        `SET FOREIGN_KEY_CHECKS=0;\n\n`,
    );

    const [tableRows] = await connection.query(
      "SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'",
    );
    const tables = tableRows.map((r) => Object.values(r)[0]);

    for (const table of tables) {
      await dumpTable(connection, table, write);
    }

    await write(`\nSET FOREIGN_KEY_CHECKS=1;\n`);
  } catch (err) {
    await endStream(out);
    safeUnlink(outPath);
    await safeEnd(connection);
    if (err instanceof AppError) throw err;
    throw new AppError({
      statusCode: 500,
      code: backupMessagesCodes.FAILED,
      translationKey: TK,
      details: { stage: "dump", error: err?.message },
    });
  }

  await endStream(out);
  await safeEnd(connection);
  return outPath;
}

/** Emits DROP + CREATE + data for a single table. */
async function dumpTable(connection, table, write) {
  const qTable = mysql.escapeId(table);

  await write(
    `\n-- -----------------------------------------------------------\n` +
      `-- Structure and data for table: ${table}\n` +
      `-- -----------------------------------------------------------\n` +
      `DROP TABLE IF EXISTS ${qTable};\n`,
  );

  const [createRows] = await connection.query(`SHOW CREATE TABLE ${qTable}`);
  const createSql = createRows[0]["Create Table"] || createRows[0]["Create View"];
  await write(`${createSql};\n\n`);

  const [columns] = await connection.query(
    "SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS " +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
    [table],
  );
  const colNames = columns.map((c) => c.COLUMN_NAME);
  const jsonCols = new Set(columns.filter((c) => c.DATA_TYPE === "json").map((c) => c.COLUMN_NAME));
  const colListSql = colNames.map((c) => mysql.escapeId(c)).join(", ");

  const rowBuffer = [];
  let wroteAny = false;

  const flush = async () => {
    if (rowBuffer.length === 0) return;
    const values = rowBuffer
      .map(
        (row) =>
          "(" + colNames.map((c) => serializeValue(row[c], jsonCols.has(c))).join(", ") + ")",
      )
      .join(",\n");
    await write(`INSERT INTO ${qTable} (${colListSql}) VALUES\n${values};\n`);
    rowBuffer.length = 0;
  };

  const stream = connection.connection.query(`SELECT * FROM ${qTable}`).stream();

  await new Promise((resolve, reject) => {
    stream.on("error", reject);
    stream.on("data", (row) => {
      wroteAny = true;
      rowBuffer.push(row);
      if (rowBuffer.length >= INSERT_CHUNK) {
        stream.pause();
        flush()
          .then(() => stream.resume())
          .catch(reject);
      }
    });
    stream.on("end", () => {
      flush().then(resolve).catch(reject);
    });
  });

  if (wroteAny) await write(`\n`);
}

/** Converts a JS value to a safe SQL literal. */
function serializeValue(value, isJsonColumn) {
  if (value === null || value === undefined) return "NULL";
  if (Buffer.isBuffer(value)) {
    return value.length ? `X'${value.toString("hex")}'` : "''";
  }
  if (isJsonColumn) {
    const jsonText = typeof value === "string" ? value : JSON.stringify(value);
    return mysql.escape(jsonText);
  }
  return mysql.escape(value);
}

function connectError(err) {
  return new AppError({
    statusCode: 500,
    code: backupMessagesCodes.DB_CONNECT_FAILED,
    translationKey: TK,
    details: { stage: "connect", error: err?.code || err?.message },
  });
}

function endStream(stream) {
  return new Promise((resolve) => stream.end(resolve));
}

async function safeEnd(connection) {
  try {
    if (connection) await connection.end();
  } catch {
    /* ignore close errors */
  }
}

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore */
  }
}
