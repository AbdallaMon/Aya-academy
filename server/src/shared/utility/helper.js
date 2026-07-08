// ===========================================================================
// helper — misc pure helpers (id-list parsing / text normalization). All pure
// functions (no I/O). List-query builders (search / filter / active /
// date-range / order) live in ./queryBuilders.js.
// ===========================================================================

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
