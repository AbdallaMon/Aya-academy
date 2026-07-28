// Declarative filter-bar config for the games admin list (the config/ folder is
// the contract — no inline filterConfig in the page).
//
// buildGamesFilters({ txt }) returns:
//   - search: debounced title search → filters.search
//   - type:   enum of game types
//   - isPublic: enum (public / private)

const GAME_TYPES = ["INTERACTIVE", "QUIZ", "STORY"];

export function buildGamesFilters({ txt }) {
  return [
    { type: "search", key: "search", label: txt.title },
    {
      type: "enum",
      key: "type",
      label: txt.type,
      options: GAME_TYPES.reduce(
        (acc, ty) => ({ ...acc, [ty]: txt[ty] }),
        {},
      ),
    },
    {
      type: "enum",
      key: "isPublic",
      label: txt.visibility,
      options: { true: txt.public, false: txt.private },
    },
  ];
}
