// Engine helpers — pure functions shared by the shell + renderers.

// Pick the localized field for the active language with a graceful fallback.
// e.g. pickText(option, "label", lng) → option.labelAr | option.labelEn
export function pickText(obj, base, lng) {
  if (!obj) return "";
  const suffix = lng === "en" ? "En" : "Ar";
  const alt = lng === "en" ? "Ar" : "En";
  return obj[`${base}${suffix}`] ?? obj[`${base}${alt}`] ?? "";
}

// Tone → MUI-friendly palette (mirrors kit.css --good/--warn/--bad zones).
export const TONE_PALETTE = {
  good: { bg: "#e7fbf3", border: "#b5f0db", ring: "#c8f6e6", text: "#0fa377" },
  warn: { bg: "#fff6e2", border: "#ffe2a6", ring: "#ffeec2", text: "#b9760a" },
  bad: { bg: "#ffeef2", border: "#ffd5de", ring: "#ffd9e0", text: "#d6436a" },
  neutral: { bg: "#ffffff", border: "#ece8ff", ring: "#efe9ff", text: "#2b2350" },
};

export function tonePalette(tone) {
  return TONE_PALETTE[tone] || TONE_PALETTE.neutral;
}

// Derive a per-question correctness check WITHOUT relying on stripped isCorrect.
// 1) explicit option.isCorrect (admin preview payload) wins if present
// 2) else mediaJson.correctIndices (derived server-side from the answer key — the
//    standard signal for choice games; non-visual so the answer isn't revealed)
// 3) else mediaJson.optionMeta[i].tone === 'good' (tone-coloured games)
export function isOptionCorrect(option, index, mediaJson) {
  if (typeof option?.isCorrect === "boolean") return option.isCorrect;
  const correct = mediaJson?.correctIndices;
  if (Array.isArray(correct) && correct.length) return correct.includes(index);
  const meta = mediaJson?.optionMeta?.[index];
  return meta?.tone === "good";
}

// Default theme used if a game omits configJson.theme.
export const DEFAULT_THEME = {
  primary: "#7c4dff",
  accent: "#18c08f",
  warn: "#ff7aa8",
  bg: "#fff7fb",
};
