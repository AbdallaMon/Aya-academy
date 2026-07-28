// Optional student + parent filters. Status intentionally stays out of this
// list: the page always shows the current and upcoming subscription slots.
export function buildSubscriptionsFilters({
  txt,
  includeParents = false,
}) {
  const filters = [
    {
      type: "asyncUser",
      key: "studentId",
      label: txt.student,
      role: "STUDENT",
    },
  ];
  if (includeParents) {
    filters.push({
      type: "asyncUser",
      key: "parentId",
      label: txt.parents,
      role: "PARENT",
    });
  }
  return filters;
}
