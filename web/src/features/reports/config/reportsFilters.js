// Declarative filter-bar config for the reports list (the config/ folder is the
// contract — no inline filterConfig in the page).
//
// buildReportsFilters({ txt }) returns a single debounced title search filter.
export function buildReportsFilters({ txt }) {
  return [{ type: "search", key: "search", label: txt.title }];
}
