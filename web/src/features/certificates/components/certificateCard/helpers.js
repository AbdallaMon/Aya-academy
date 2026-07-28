// Pure helpers for the certificate card — value math + theme parsing + frame
// CSS resolution. No JSX; shared by the card orchestrator and its sub-parts.

// Clamp a number into [min, max], falling back to `fallback` for non-numbers.
export function clampNum(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// Hide a broken brand/watermark image so the layout never breaks.
export function hideOnError(e) {
  e.currentTarget.style.display = "none";
}

export function parseTheme(themeJson) {
  if (!themeJson) return {};
  if (typeof themeJson === "object") return themeJson;
  try {
    return JSON.parse(themeJson) || {};
  } catch {
    return {};
  }
}

// True when a string looks like a CSS color-function/gradient (not a hex/keyword).
export function isCssBackground(value) {
  return /gradient|rgb|hsl|var\(/i.test(String(value || ""));
}

// Lighten a hex color toward white by `amount` (0..1) — used for soft tints.
// Returns the input unchanged for non-hex values (e.g. gradient strings).
export function tint(hex, amount = 0.85) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ""));
  if (!m) return hex;
  const mix = (c) => Math.round(parseInt(c, 16) * (1 - amount) + 255 * amount);
  return `rgb(${mix(m[1])}, ${mix(m[2])}, ${mix(m[3])})`;
}

// Darken a hex color toward black by `amount` (0..1) — for foil/edge contrast.
export function shade(hex, amount = 0.25) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ""));
  if (!m) return hex;
  const mix = (c) => Math.round(parseInt(c, 16) * (1 - amount));
  return `rgb(${mix(m[1])}, ${mix(m[2])}, ${mix(m[3])})`;
}

// Build the painted surface from a background value (hex → soft gradient,
// gradient string → used verbatim).
export function buildSurface(background) {
  if (isCssBackground(background)) return background;
  return `linear-gradient(135deg, ${tint(background, 0.35)} 0%, ${background} 55%, ${tint(background, 0.15)} 100%)`;
}

// Resolve a borderStyle (and the exam override) into the concrete frame CSS the
// card paints: the outer rule (inset 10), an optional inner hairline (inset 22),
// and whether to add the round corner scallops. "ornate" and "none" are handled
// separately by the caller and never reach here.
export function buildFrame({ style, isExam, accent, secondary }) {
  if (isExam) {
    return {
      border: `4px solid ${accent}`,
      radius: 3,
      boxShadow: `inset 0 0 0 2px ${secondary}`,
      hairline: { border: `1px solid ${accent}`, radius: 2 },
      scallop: true,
    };
  }
  switch (style) {
    case "double":
      return {
        border: `3px double ${accent}`,
        radius: 3,
        boxShadow: "none",
        hairline: { border: `1.5px dashed ${secondary}`, radius: 2 },
        scallop: true,
      };
    case "simple":
      return { border: `2px solid ${accent}`, radius: 3, boxShadow: "none", hairline: null, scallop: false };
    case "rounded":
      return {
        border: `5px solid ${accent}`,
        radius: 7,
        boxShadow: `inset 0 0 0 2px ${secondary}`,
        hairline: { border: `1.5px solid ${secondary}`, radius: 6 },
        scallop: false,
      };
    case "dashed":
      return { border: `3px dashed ${accent}`, radius: 3, boxShadow: "none", hairline: null, scallop: false };
    case "inset":
      return {
        border: `3px solid ${accent}`,
        radius: 3,
        boxShadow: `inset 0 0 16px rgba(0,0,0,0.18)`,
        hairline: null,
        scallop: false,
      };
    case "groove":
      return { border: `5px groove ${accent}`, radius: 3, boxShadow: "none", hairline: null, scallop: false };
    case "ribbon":
      return {
        border: `6px solid ${accent}`,
        radius: 3,
        boxShadow: `inset 0 0 0 4px ${tint(accent, 0.85)}, inset 0 0 0 7px ${secondary}`,
        hairline: null,
        scallop: true,
      };
    case "foil":
    default:
      return {
        border: `5px solid ${accent}`,
        radius: 3,
        boxShadow: `inset 0 0 0 2px ${secondary}`,
        hairline: { border: `1.5px dashed ${secondary}`, radius: 2 },
        scallop: true,
      };
  }
}
