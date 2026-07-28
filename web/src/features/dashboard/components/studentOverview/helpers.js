// Shared helpers/constants for the student (child) dashboard overview.

export const GAME_TONES = ["primary", "secondary", "success", "info"];

// Raw DB statuses (NOT_STARTED / ASSIGNED / IN_PROGRESS / COMPLETED) are jargon
// to a 5–12-year-old — map them to a friendly, localized label instead.
export const GAME_STATUS_KEY = {
  COMPLETED: "statusCompleted",
  IN_PROGRESS: "statusInProgress",
};

export function gameStatusLabel(txt, status) {
  return txt[GAME_STATUS_KEY[status] || "statusNew"];
}

// A badge icon is only safe to print if it's an actual emoji; an icon-NAME or
// URL string would render as raw garbage, so we fall back to a default medal.
export const isEmojiIcon = (s) =>
  typeof s === "string" && /\p{Extended_Pictographic}/u.test(s);
