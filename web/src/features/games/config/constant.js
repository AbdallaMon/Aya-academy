// Game engine config — endpoints + shared maps. The `config/` folder is the
// contract: renderers and pages read these, not inline literals.

// Backend game endpoints (see server/src/modules/games/game.route.js).
export const GAMES_PUBLIC_URL = "/games/public"; // GET list
export const GAME_PUBLIC_BY_SLUG_URL = "/games/public"; // GET /:slug (public)
export const GAME_PUBLIC_FREE_URL = "/games/public/free"; // GET the single free game (public)
export const GAME_AUTH_BY_SLUG_URL = "/games/by-slug"; // GET /:slug (auth — any active game)
export const GAME_BY_ID_URL = "/games"; // GET /:id (auth)
export const GAME_ATTEMPT_URL = "/games"; // POST /:id/attempt
export const GAME_SET_FREE_URL = "/games"; // POST /:id/free (admin, GAME.MANAGE)

// Dev fallback slug for the public free-trial game — used only when the API is
// unreachable so the marketing demo still plays without a database.
export const FREE_GAME_FALLBACK_SLUG = "phone-manners";

// Per-option tone → card palette key (kid coloring, NOT authoritative scoring).
export const TONE_GOOD = "good";
export const TONE_WARN = "warn";
export const TONE_BAD = "bad";

// Question kinds the engine understands (mirror of GameQuestionKind in use).
export const GAME_KINDS = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  EMOJI_CHOICE: "EMOJI_CHOICE",
  TAP_CHOICE: "TAP_CHOICE",
  SCENARIO: "SCENARIO",
  PHONE_CALL: "PHONE_CALL",
  DIALPAD: "DIALPAD",
  TONE_SLIDER: "TONE_SLIDER",
  // ── Phase D: 5 new animation-game kinds ──
  MATCHING: "MATCHING",
  COMPASS: "COMPASS",
  CALENDAR_DROP: "CALENDAR_DROP",
  COLORING: "COLORING",
  BOARD_DICE: "BOARD_DICE",
};
