"use client";

// Cell content resolution for DataTable, extracted verbatim.
//
// Precedence: a column's own renderCell wins; then null/undefined -> em dash,
// booleans -> check/em dash, everything else -> String(value).

export function renderCellContent(col, row) {
  const value = row?.[col.field];
  if (typeof col.renderCell === "function") return col.renderCell({ row, value });
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "✓" : "—";
  return String(value);
}
