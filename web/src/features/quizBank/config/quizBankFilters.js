// Declarative filter-bar config for the question-bank list (the config/ folder
// is the contract — no inline filterConfig in the page). Takes runtime deps
// (txt, category list) so the category enum can be built from live data.
export function buildQuizBankFilters({ txt, categories }) {
  const categoryOptions = { ALL: txt.allCategories };
  (categories || []).forEach((c) => {
    categoryOptions[String(c.id)] = c.nameAr || c.nameEn || `#${c.id}`;
  });
  return [
    { type: "search", key: "search", label: txt.searchLabel },
    {
      type: "enum",
      key: "categoryId",
      label: txt.category,
      options: categoryOptions,
    },
    {
      type: "enum",
      key: "isActive",
      label: txt.status,
      options: { ALL: txt.allStatuses, true: txt.active, false: txt.inactive },
    },
  ];
}
