/**
 * Build a Prisma `OR` array for a search across several keys.
 * (MySQL collations are case-insensitive by default, so no `mode` here.)
 * Returns undefined when there's no search term (so callers can spread safely).
 */
export function buildSearchQuery({ search, keys }) {
  const term = typeof search === "string" ? search.trim() : "";
  if (!term) return undefined;
  return keys.map((key) => ({ [key]: { contains: term } }));
}

/** Parse an `isActive`-style filter that may arrive as "ALL" | "true" | "false". */
export function parseBooleanFilter(value) {
  if (value === undefined || value === null || value === "" || value === "ALL") {
    return undefined;
  }
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
}
