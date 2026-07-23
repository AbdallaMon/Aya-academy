// Declarative filter-bar config for the subscriptions list (the config/ folder is
// the contract — no inline filterConfig in the page).
//
export function buildSubscriptionsFilters({ txt }) {
  return [
    {
      type: "enum",
      key: "status",
      label: txt.status,
      options: {
        ALL: txt.all,
        PENDING: txt.PENDING,
        UPCOMING: txt.UPCOMING,
        ACTIVE: txt.ACTIVE,
        EXPIRED: txt.EXPIRED,
        CANCELLED: txt.CANCELLED,
      },
    },
  ];
}
