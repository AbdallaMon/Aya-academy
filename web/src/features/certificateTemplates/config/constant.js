// Admin certificate-templates feature constants.

import { CERTIFICATE_TEMPLATE_TYPES } from "@aya/shared";

export const CERTIFICATE_TEMPLATES_URL = "certificate-templates";

// Template purpose. GENERAL = admin-picked for manual certificates; GAME = the
// single template auto-applied to every game certificate (only one may exist).
export const TEMPLATE_TYPES = [
  CERTIFICATE_TEMPLATE_TYPES.GENERAL,
  CERTIFICATE_TEMPLATE_TYPES.GAME,
];

// Style enums offered by the template form (mirror the CertificateCard themeJson
// vocabulary). Orientation + border styles match the renderer's switches.
export const TEMPLATE_ORIENTATIONS = ["portrait", "landscape"];
export const TEMPLATE_BORDER_STYLES = [
  "ornate",
  "foil",
  "double",
  "simple",
  "rounded",
  "dashed",
  "inset",
  "groove",
  "ribbon",
  "none",
];

// Decorative motifs the card paints behind the content (now rendered for the
// ornate frame too, so changing the decoration always shows in the preview).
export const TEMPLATE_DECORATIONS = [
  "elegant",
  "geometric",
  "classic",
  "stars",
  "rainbow",
  "crescent",
  "balloons",
  "badges",
  "confetti",
  "hearts",
  "lanterns",
  "florals",
  "sparkles",
  "none",
];

// Heading / student-name font styles (themeJson.fontStyle). Each loads a
// distinct Arabic web font (see globals.css @import).
export const TEMPLATE_FONT_STYLES = [
  "elegant",
  "classic",
  "modern",
  "kufi",
  "ruqaa",
  "naskh",
];

// Header logo size.
export const TEMPLATE_LOGO_SIZES = ["sm", "md", "lg"];

// Slider bounds (mirror the certificates renderer clamps).
export const NAME_SCALE_MIN = 0.85;
export const NAME_SCALE_MAX = 1.3;
export const HEADING_SCALE_MIN = 0.8;
export const HEADING_SCALE_MAX = 1.4;
export const WATERMARK_OPACITY_MIN = 0.03;
export const WATERMARK_OPACITY_MAX = 0.15;
// Content spacing (vertical breathing room between content rows).
export const CONTENT_SPACING_MIN = 0.5;
export const CONTENT_SPACING_MAX = 1.8;

// Sensible default themeJson for a brand-new template (matches the ornate
// Arabic certificate look described in the spec).
export const DEFAULT_TEMPLATE_THEME = {
  orientation: "portrait",
  borderStyle: "ornate",
  decoration: "elegant",
  fontStyle: "elegant",
  accent: "#1E6F5C",
  secondary: "#C9A227",
  background: "#FBF7EC",
  nameColor: "#1F2A44",
  showPhoto: true,
  showBismillah: true,
  showSeal: true,
  showWatermark: true,
  watermarkOpacity: 0.05,
  showTagline: true,
  showDate: true,
  nameScale: 1,
  headingScale: 1,
  contentSpacing: 1,
  logoSize: "md",
  sealText: "",
};
