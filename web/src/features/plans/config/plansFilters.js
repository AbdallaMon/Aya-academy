// Declarative filter-bar config for the plans list (the config/ folder is the
// contract — no inline filterConfig in the page).
//
// buildPlansFilters({ txt }) returns a single debounced title search filter.
export function buildPlansFilters({ txt }) {
  return [{ type: "search", key: "search", label: txt.title }];
}
