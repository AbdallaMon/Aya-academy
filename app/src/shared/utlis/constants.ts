// ayaColors.js
export const colors = {
  primary: "#1ABC9C", // Turquoise - main brand color
  lightPrimary: "#1abc9c1c", // for gradients and overlays
  accent: "#F6C453", // Warm yellow - highlights, badges, CTA accents
  support: "#1E6F5C", // Deep green - support / success / Quran feel
  background: "#ffffff", // Soft light background for pages
  paperBackground: "#F9FBFF", // White paper background for cards, modals
  text: "#25313F", // Main text (navy-ish)
  mutedText: "#6B7A8C", // Secondary text
  white: "#FFFFFF",
  black: "#101318",
  lightText: "#F0F3F7", // For dark mode or dark backgrounds
};

// ayaDarkColors.ts
export const darkColors = {
  // === Brand Core (kept close to original) ===
  primary: "#1ABC9C", // keep turquoise brand
  lightPrimary: "#1abc9c33", // visible on dark bg
  accent: "#F6C453", // stars / moon yellow
  support: "#1E6F5C",

  // === Dark Backgrounds (from image) ===
  background: "#0E1A2B", // deep night blue (main bg)
  paperBackground: "#132238", // cards, modals, surfaces
  elevatedBackground: "#182B45", // hover, raised cards

  // === Text ===
  text: "#E8EDF4", // main text on dark
  mutedText: "#A8B3C7", // secondary text
  lightText: "#FFFFFF",

  // === Utility ===
  border: "#223A5E", // subtle borders
  overlay: "rgba(14, 26, 43, 0.85)",

  // === Constants ===
  white: "#0A0D12",
  black: "#FFFFFF",
};
