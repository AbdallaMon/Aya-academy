// Declarative filter-bar config for the badge-definitions admin list (the config/
// folder is the contract — no inline filterConfig in the page).
//
// buildBadgesAdminFilters({ txt }) returns:
//   - search: debounced code search → filters.search
export function buildBadgesAdminFilters({ txt }) {
  return [{ type: "search", key: "search", label: txt.code }];
}
