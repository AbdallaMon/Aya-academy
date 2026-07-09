// Declarative filter-bar config for the subscriptions list (the config/ folder is
// the contract — no inline filterConfig in the page).
//
// The status and origin filters were removed from the subscriptions list; the
// function/exports stay in place so existing callers keep working.
export function buildSubscriptionsFilters() {
  return [];
}
