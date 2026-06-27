// Declarative filter bar config for the quizzes list.
//
// Built as a factory so the labels resolve to ready strings from `txt` (the same
// pattern GamesAdminPage uses) — the DataTable translator is empty here, so the
// FilterBar falls through to these literal labels.
//
// - search: debounced title search → filters.search → ?search= (backend matches title)
// - status: enum → filters.status → ?status=done|pending
//
// The FilterBar treats an "ALL" enum value as "clear the filter", so ALL maps to
// no status param (both done + pending). The enum option KEYS are the query
// values the backend expects ("done" / "pending"); the option VALUES are the
// localized display labels.
// `children` (optional) is an array of { id, name, nickname }. When non-empty, a
// per-child enum is appended (parent "أطفالي" scoping). The enum option KEYS are
// the emitted values (the child id), exactly like the status filter — so a
// selection writes filters.studentId → ?studentId=<id>; "ALL" clears the param.
export function buildQuizzesFilters(txt, children = []) {
  const filters = [
    { type: "search", key: "search", label: txt.title },
    {
      type: "enum",
      key: "status",
      label: txt.statusFilterLabel,
      options: { ALL: txt.statusAll, done: txt.statusDone, pending: txt.statusPending },
    },
  ];

  if (Array.isArray(children) && children.length > 0) {
    const childOptions = children.reduce(
      (acc, c) => ({ ...acc, [c.id]: c.nickname || c.name || String(c.id) }),
      { ALL: txt.childAll },
    );
    filters.push({
      type: "enum",
      key: "studentId",
      label: txt.childFilterLabel,
      options: childOptions,
    });
  }

  return filters;
}
