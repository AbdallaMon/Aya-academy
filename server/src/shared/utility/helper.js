// ===========================================================================
// helper — list-query builders (search / filter / active / date-range / order).
// API shape ported from the reference (school-system / Transaction-app) so repos
// build `where` the same way everywhere. All pure functions (no I/O).
//
// Convention: the repo receives raw query params (search / isActive / ...) and
// builds `where` via these helpers instead of repeating filter logic per module.
//
// NOTE (aya): our boolean field is `isActive` and the frontend sends
// "ALL" | "true" | "false". buildIsActiveFilter adapts those (and the
// reference's "active" | "inactive") to true | false | undefined, preserving
// aya's "undefined ⇒ no filter (show all)" behavior.
// ===========================================================================

/**
 * Build the OR clause for a text search (contains).
 * Two supported call forms:
 *  - Reference form: ({ searchType, search, keysValues, keyOr }) → { OR } | {}
 *      • searchType="multiKeySearch": each key searched with its own value.
 *      • searchType="initial": the general `search` searched across keys with a value.
 *      • keyOr="k1,k2": restrict to specific keys with their values.
 *  - Legacy aya form: ({ search, keys }) → array | undefined
 *      • kept during the convention migration; callers migrate to the form above.
 */
export function buildSearchQuery({ searchType, search, keysValues, keys, keyOr } = {}) {
  // ── Legacy form (array | undefined) — keep working until all callers migrate ──
  if (keys && !keysValues) {
    const term = typeof search === "string" ? search.trim() : "";
    if (!term) return undefined;
    return keys.map((key) => ({ [key]: { contains: term } }));
  }

  // ── Reference form ({ OR } | {}) ──
  const kv = keysValues || [];
  const searchOR = [];
  const isKeyOrSearch = keyOr && keyOr.length > 0;

  if (isKeyOrSearch) {
    const keyOrArr = keyOr.split(",").map((k) => k.trim());
    for (const item of kv) {
      if (keyOrArr.includes(item.key) && item.value) {
        searchOR.push({ [item.key]: { contains: item.value } });
      }
    }
  }
  if (searchType === "initial" && !isKeyOrSearch && search && kv.length) {
    for (const item of kv) {
      if (item.value) searchOR.push({ [item.key]: { contains: search } });
    }
  }
  if (searchType === "multiKeySearch") {
    for (const item of kv) {
      if (item.value) searchOR.push({ [item.key]: { contains: item.value } });
    }
  }

  return searchOR.length > 0 ? { OR: searchOR } : {};
}

/**
 * Build an AND clause from simple equality / inclusion filters.
 * keys: field names allowed to be filtered from `filters`.
 */
export function buildFilterQuery({ filters = {}, keys = [] }) {
  const filterAND = [];
  for (const key of keys) {
    if (Array.isArray(filters[key])) {
      filterAND.push({ [key]: { in: filters[key] } });
    } else if (filters[key] !== undefined && filters[key] !== "") {
      filterAND.push({ [key]: filters[key] });
    }
  }
  return filterAND.length > 0 ? { AND: filterAND } : {};
}

/**
 * Active filter. Accepts aya's "ALL" | "true" | "false" (and booleans), plus the
 * reference's "active" | "inactive". Returns true | false | undefined.
 * undefined ⇒ caller omits the filter (show all) — aya's behavior.
 */
export function buildIsActiveFilter({ isActive } = {}) {
  if (isActive === undefined || isActive === null || isActive === "" || isActive === "ALL") {
    return undefined;
  }
  if (typeof isActive === "boolean") return isActive;
  if (isActive === "active" || isActive === "true" || isActive === "1") return true;
  if (isActive === "inactive" || isActive === "false" || isActive === "0") return false;
  return undefined;
}

/** Parse an `isActive`-style filter that may arrive as "ALL" | "true" | "false". */
export function parseBooleanFilter(value) {
  if (value === undefined || value === null || value === "" || value === "ALL") {
    return undefined;
  }
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
}

/**
 * Date range from query. Accepts:
 *   - "YYYY-MM-DD,YYYY-MM-DD"
 *   - JSON '{"from":"...","to":"..."}' (or fromDate/toDate)
 *   - object { from, to } (or { fromDate, toDate })
 * A date without time is treated inclusively: from→start of day, to→end (UTC).
 * Returns { gte?, lte? } or undefined.
 */
export function buildDateRangeFilter({ dateRange } = {}) {
  if (!dateRange) return undefined;

  let from;
  let to;
  if (typeof dateRange === "object" && !Array.isArray(dateRange)) {
    from = dateRange.from ?? dateRange.fromDate;
    to = dateRange.to ?? dateRange.toDate;
  } else if (typeof dateRange === "string") {
    const trimmed = dateRange.trim();
    if (!trimmed || trimmed === "[object Object]") return undefined;
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        from = parsed.from ?? parsed.fromDate;
        to = parsed.to ?? parsed.toDate;
      } catch {
        return undefined;
      }
    } else {
      [from, to] = trimmed.split(",");
    }
  } else {
    return undefined;
  }

  const range = {};
  const start = parseRangeBoundary(from, "start");
  if (start) range.gte = start;
  const end = parseRangeBoundary(to, "end");
  if (end) range.lte = end;
  return Object.keys(range).length > 0 ? range : undefined;
}

function parseRangeBoundary(raw, edge) {
  if (raw == null || raw === "") return undefined;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? undefined : raw;
  }
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const iso = dateOnly
    ? `${trimmed}T${edge === "end" ? "23:59:59.999" : "00:00:00.000"}Z`
    : trimmed;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeSortKey(value) {
  if (value == null) return "id";
  return String(value)
    .trim()
    .replace(/^['"`]+|['"`]+$/g, "");
}

/** Build orderBy with a stable secondary sort by defaultSort for page stability. */
export function buildOrderBy({ sort, sortDirection = "asc", defaultSort = "id" } = {}) {
  const s = normalizeSortKey(sort);
  const def = normalizeSortKey(defaultSort);
  if (s && s !== def) {
    return [{ [s]: sortDirection }, { [def]: sortDirection }];
  }
  return { [def]: sortDirection };
}

/** "1,2,3" | "[1,2,3]" | [1,2,3] → [1,2,3] (finite numbers only). */
export function parseIdList(raw) {
  if (raw == null || raw === "") return [];
  let values;
  if (Array.isArray(raw)) {
    values = raw;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        values = JSON.parse(trimmed);
      } catch {
        return [];
      }
    } else {
      values = trimmed.split(",");
    }
  } else {
    return [];
  }
  return values.map((v) => Number(v)).filter((n) => Number.isFinite(n));
}

/** "1,2,3" → [1,2,3] (for excluding ids in where.id.notIn). */
export function excludeIdsFromString(excludeIds) {
  return excludeIds && excludeIds.length > 0
    ? excludeIds.split(",").map((id) => Number(id))
    : [];
}

/** Collapse repeated whitespace and trim. */
export function normalizeText(text) {
  return text?.trim().replace(/\s+/g, " ");
}
