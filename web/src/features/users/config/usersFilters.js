// Declarative filter-bar config for the users list (the config/ folder is the
// contract — no inline filterConfig in the page).
//
// buildUsersFilters({ txt, lockedRole }) returns:
//   - search: debounced name/email/nickname search → filters.search
//   - role:   enum (omitted entirely when the list is locked to a single role)
//   - isActive: enum, defaults to "Active only" (seeded in the page); "ALL" clears
//
// The FilterBar treats an "ALL" enum value as "clear the filter". Option KEYS are
// the query values the backend expects; option VALUES are the localized labels.
export function buildUsersFilters({ txt, lockedRole }) {
  return [
    { type: "search", key: "search", label: txt.searchLabel },
    // When the list is locked to a role, the role filter is omitted entirely.
    ...(lockedRole
      ? []
      : [
          {
            type: "enum",
            key: "role",
            label: txt.role,
            options: {
              ADMIN: txt.admin,
              PARENT: txt.parent,
              STUDENT: txt.student,
            },
          },
        ]),
    {
      type: "enum",
      key: "isActive",
      label: txt.statusLabel,
      // Active is the default (seeded in the page); "All" clears the filter.
      options: { true: txt.activeYes, false: txt.activeNo, ALL: txt.all },
    },
  ];
}
