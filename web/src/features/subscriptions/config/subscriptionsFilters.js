// Optional student + parent filters. Status intentionally stays out of this
// list: the page always shows the current and upcoming subscription slots.
const optionLabel = (user) =>
  user?.nickname && user.nickname !== user.name
    ? `${user.name} (${user.nickname})`
    : user?.name || String(user?.id ?? "");

function userOptions(users, allLabel) {
  return (users || []).reduce(
    (options, user) => ({
      ...options,
      [user.id]: optionLabel(user),
    }),
    { ALL: allLabel },
  );
}

export function buildSubscriptionsFilters({
  txt,
  students = [],
  parents = [],
  includeParents = false,
}) {
  const filters = [];
  if (students.length) {
    filters.push({
      type: "enum",
      key: "studentId",
      label: txt.student,
      options: userOptions(students, txt.allStudents),
    });
  }
  if (includeParents && parents.length) {
    filters.push({
      type: "enum",
      key: "parentId",
      label: txt.parents,
      options: userOptions(parents, txt.allParents),
    });
  }
  return filters;
}
