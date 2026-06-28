// ===========================================================================
// Resolves DB connection parts for dump/restore. Aya's runtime adapter uses the
// separate DATABASE_HOST/USER/PASSWORD/NAME parts (DATABASE_URL is for prisma
// migrations only), so we prefer the parts and fall back to parsing the URL.
// Never logs any secret.
// ===========================================================================

/**
 * @returns {{ host:string, port:string, user:string, password:string, database:string }}
 */
export function parseDatabaseConnection() {
  // Prefer the separate parts (what the prisma adapter uses at runtime).
  const host = process.env.DATABASE_HOST;
  const database = process.env.DATABASE_NAME;
  if (host && database) {
    return {
      host,
      port: process.env.DATABASE_PORT || "3306",
      user: process.env.DATABASE_USER || "root",
      password: process.env.DATABASE_PASSWORD || "",
      database,
    };
  }

  // Fallback: parse DATABASE_URL (mysql://user:pass@host:port/db).
  const url = process.env.DATABASE_URL;
  if (url) {
    const u = new URL(url);
    return {
      host: u.hostname || "localhost",
      port: u.port || "3306",
      user: decodeURIComponent(u.username || ""),
      password: decodeURIComponent(u.password || ""),
      database: u.pathname.replace(/^\//, ""),
    };
  }

  throw new Error(
    "DATABASE_HOST/DATABASE_NAME (or DATABASE_URL) are not defined in the env (.env)",
  );
}
