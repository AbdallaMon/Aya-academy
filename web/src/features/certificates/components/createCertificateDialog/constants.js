// Shared constants + the themeJson builder for the create-certificate dialog and
// its form sections. No JSX — pure data + one pure function.

import {
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND,
  DEFAULT_TEMPLATE_KEY,
  DEFAULT_FONT_STYLE,
  DEFAULT_ORIENTATION,
  DEFAULT_BORDER_STYLE,
  DEFAULT_LOGO_SIZE,
  DEFAULT_NAME_SCALE,
  DEFAULT_SHOW_WATERMARK,
  DEFAULT_WATERMARK_OPACITY,
} from "../../config/constant.js";

export const FORM_ID = "create-certificate-form";

export const EMPTY_VALUES = {
  studentId: "",
  // optional badge-award capability (toggle + picker)
  awardBadge: false,
  badgeId: "",
  // template path
  templateId: "", // "" = custom / no template
  reasonAr: "",
  reasonEn: "",
  titleAr: "",
  titleEn: "",
  subtitleAr: "",
  subtitleEn: "",
  bodyAr: "",
  bodyEn: "",
  templateKey: DEFAULT_TEMPLATE_KEY,
  fontStyle: DEFAULT_FONT_STYLE,
  accent: DEFAULT_ACCENT,
  background: DEFAULT_BACKGROUND,
  emoji: "",
  signature: "",
  showSeal: true,
  // layout / branding / footer
  orientation: DEFAULT_ORIENTATION,
  borderStyle: DEFAULT_BORDER_STYLE,
  secondary: "",
  logoSize: DEFAULT_LOGO_SIZE,
  showWatermark: DEFAULT_SHOW_WATERMARK,
  watermarkOpacity: DEFAULT_WATERMARK_OPACITY,
  nameScale: DEFAULT_NAME_SCALE,
  showTagline: true,
  showDate: true,
  sealText: "",
  signatureTitle: "",
};

// Labels for the font-style select (keys map to txt.fontElegant / etc.).
export const FONT_LABEL_KEY = {
  elegant: "fontElegant",
  classic: "fontClassic",
  modern: "fontModern",
  kufi: "fontKufi",
  ruqaa: "fontRuqaa",
  naskh: "fontNaskh",
};

// Localized labels for the enum selects (value → txt key).
export const ORIENTATION_LABEL_KEY = {
  landscape: "orientationLandscape",
  portrait: "orientationPortrait",
};
export const BORDER_LABEL_KEY = {
  foil: "borderFoil",
  ornate: "borderOrnate",
  double: "borderDouble",
  simple: "borderSimple",
  rounded: "borderRounded",
  dashed: "borderDashed",
  inset: "borderInset",
  groove: "borderGroove",
  ribbon: "borderRibbon",
  none: "borderNone",
};
export const LOGO_SIZE_LABEL_KEY = {
  sm: "logoSizeSm",
  md: "logoSizeMd",
  lg: "logoSizeLg",
};

// Single source of truth for the themeJson written to BOTH the live preview and
// the submit payload — keeps them from drifting.
export function buildThemeJson(v) {
  return {
    accent: v.accent,
    background: v.background,
    decoration: v.templateKey,
    fontStyle: v.fontStyle,
    emoji: v.emoji?.trim() || undefined,
    subtitleAr: v.subtitleAr?.trim() || undefined,
    subtitleEn: v.subtitleEn?.trim() || undefined,
    signature: v.signature?.trim() || undefined,
    showSeal: v.showSeal,
    // layout
    orientation: v.orientation,
    borderStyle: v.borderStyle,
    secondary: v.secondary?.trim() || undefined,
    nameScale: Number(v.nameScale),
    // branding
    logoSize: v.logoSize,
    showWatermark: v.showWatermark,
    watermarkOpacity: Number(v.watermarkOpacity),
    showTagline: v.showTagline,
    // footer
    showDate: v.showDate,
    sealText: v.sealText?.trim() || undefined,
    signatureTitle: v.signatureTitle?.trim() || undefined,
  };
}
