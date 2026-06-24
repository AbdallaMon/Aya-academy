// ===========================================================================
// schemaCheck — pure logic (no Prisma) comparing a dump's structure with the DB.
//
// Used before restoring an external file: we extract the dump's tables/columns
// from the .sql text and compare them to the current schema (fetched from a repo
// via information_schema). If the two sets do not fully match → restore is
// blocked.
//
// We exclude `_prisma_migrations` from the comparison (it stays in the .sql and
// is imported as usual).
// ===========================================================================

const EXCLUDED_TABLES = new Set(["_prisma_migrations"]);

const NON_COLUMN_PREFIXES = [
  "PRIMARY KEY",
  "UNIQUE KEY",
  "UNIQUE INDEX",
  "KEY",
  "INDEX",
  "CONSTRAINT",
  "FOREIGN KEY",
  "FULLTEXT KEY",
  "FULLTEXT INDEX",
  "SPATIAL KEY",
  "SPATIAL INDEX",
  "CHECK",
];

/**
 * Extracts a map of table -> set of columns from dump (.sql) text.
 * @param {string} sqlText
 * @returns {Map<string, Set<string>>}
 */
export function extractSchemaFromSql(sqlText) {
  const result = new Map();
  if (!sqlText) return result;

  const tableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`\s*\(([\s\S]*?)\n\)/gi;
  let match;
  while ((match = tableRe.exec(sqlText)) !== null) {
    const tableName = match[1];
    if (EXCLUDED_TABLES.has(tableName)) continue;
    const body = match[2];
    const columns = new Set();

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      const upper = line.toUpperCase();
      if (NON_COLUMN_PREFIXES.some((p) => upper.startsWith(p))) continue;
      const colMatch = line.match(/^`([^`]+)`/);
      if (colMatch) columns.add(colMatch[1]);
    }

    result.set(tableName, columns);
  }

  return result;
}

/**
 * Compares the dump schema with the current DB schema.
 * @param {Map<string, Set<string>>} dumpSchema
 * @param {Map<string, Set<string>>} dbSchema
 * @returns {{ ok: boolean, missingTables: string[], extraTables: string[], columnDiffs: {table:string, missing:string[], extra:string[]}[] }}
 */
export function compareSchemas(dumpSchema, dbSchema) {
  const missingTables = [];
  for (const table of dbSchema.keys()) {
    if (!dumpSchema.has(table)) missingTables.push(table);
  }

  const extraTables = [];
  for (const table of dumpSchema.keys()) {
    if (!dbSchema.has(table)) extraTables.push(table);
  }

  const columnDiffs = [];
  for (const [table, dumpCols] of dumpSchema.entries()) {
    const dbCols = dbSchema.get(table);
    if (!dbCols) continue;
    const missing = [];
    for (const col of dbCols) {
      if (!dumpCols.has(col)) missing.push(col);
    }
    const extra = [];
    for (const col of dumpCols) {
      if (!dbCols.has(col)) extra.push(col);
    }
    if (missing.length || extra.length) {
      columnDiffs.push({ table, missing, extra });
    }
  }

  const ok = missingTables.length === 0 && extraTables.length === 0 && columnDiffs.length === 0;
  return { ok, missingTables, extraTables, columnDiffs };
}

export { EXCLUDED_TABLES };
