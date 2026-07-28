// Declarative filter-bar config for the coupons list (the config/ folder is the
// contract — no inline filterConfig in the page).
//
// buildCouponsFilters({ txt, sourceOptions }) returns:
//   - search: debounced code search
//   - source: enum built from the coupon sources (page-computed labels)
//   - status: enum (active/disabled/consumed), "ALL" clears the filter
export function buildCouponsFilters({ txt, sourceOptions }) {
  return [
    { type: "search", key: "search", label: txt.code },
    {
      type: "enum",
      key: "source",
      label: txt.source,
      options: { ALL: txt.all, ...sourceOptions },
    },
    {
      type: "enum",
      key: "status",
      label: txt.status,
      options: {
        ALL: txt.all,
        active: txt.enabled,
        disabled: txt.disabled,
        consumed: txt.consumed,
      },
    },
  ];
}
