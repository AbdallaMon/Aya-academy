export const CERTIFICATES_URL = "certificates";
export const CERTIFICATE_TEMPLATES_URL = "certificate-templates";

// Active-badge picker in the create dialog (optional "award a badge" capability).
export const BADGES_URL = "badges";

// Endpoint for the admin student picker in the create dialog.
export const STUDENTS_PICKER_URL = "users";
export const STUDENTS_PICKER_PARAMS = { role: "STUDENT", limit: 100 };

// Decoration motifs the CertificateCard knows how to render. The selected value
// is stored as themeJson.decoration AND mirrored to the certificate.templateKey.
// "EXAM" is the unified, visually distinct style for quiz/exam certificates;
// the admin builder can pick it too.
export const DECORATION_KEYS = [
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

// Selectable in the admin create dialog (the named decorations + EXAM + the
// safe default). EXAM forces the unified exam look regardless of other choices.
export const TEMPLATE_KEYS = [...DECORATION_KEYS, "EXAM"];

// The unified exam/quiz template key (mirrors @aya/shared CERTIFICATE_TEMPLATE_KEYS.EXAM).
export const EXAM_TEMPLATE_KEY = "EXAM";

// Heading / name font styles the card supports (stored as themeJson.fontStyle).
export const FONT_STYLES = [
  "elegant",
  "classic",
  "modern",
  "kufi",
  "ruqaa",
  "naskh",
];
export const DEFAULT_FONT_STYLE = "elegant";

// CSS font stacks per fontStyle. Each loads a DISTINCT Arabic web font (see the
// @import in globals.css) so the style genuinely changes for Arabic text, with a
// matching Latin fallback. Every text node on the card uses one of these.
export const FONT_STACKS = {
  elegant: `"Amiri", "Georgia", "Times New Roman", serif`,
  classic: `"Scheherazade New", "Amiri", "Georgia", serif`,
  modern: `"Cairo", "Helvetica Neue", Arial, sans-serif`,
  kufi: `"Reem Kufi", "Cairo", "Trebuchet MS", sans-serif`,
  ruqaa: `"Aref Ruqaa", "Amiri", "Georgia", serif`,
  naskh: `"Noto Naskh Arabic", "Amiri", "Times New Roman", serif`,
};

// Academy brand shown on EVERY certificate (logo + name).
export const ACADEMY_LOGO_SRC = "/logos/logo.png";

// Curated accent presets offered as quick swatches in the create dialog.
export const ACCENT_PRESETS = [
  "#0E9F8E", // teal
  "#7C4DFF", // royal purple
  "#C9A227", // gold
  "#E0457B", // rose
  "#2F80ED", // blue
  "#E08E0B", // amber
  "#16A34A", // green
  "#1F2A44", // navy
];

// Sensible theme fallbacks (used by the card and as create-form defaults).
export const DEFAULT_ACCENT = "#0E9F8E";
export const DEFAULT_BACKGROUND = "#fffdf6";
export const DEFAULT_TEMPLATE_KEY = "elegant";

// ── Layout / branding / style options (all OPTIONAL in themeJson) ──────────────

// Page orientation. "landscape" keeps the classic A4-landscape look; "portrait"
// flips the aspect ratio (and the card tunes spacing for it).
export const ORIENTATIONS = ["landscape", "portrait"];
export const DEFAULT_ORIENTATION = "landscape";

// Frame treatment around the certificate surface.
//   foil   → the current double (thick + hairline) frame (default)
//   ornate → an Islamic green/gold decorative frame with corner arabesques
//   double → two equal-weight rules
//   simple → a single clean rule
//   none   → no frame (background/decoration only)
export const BORDER_STYLES = [
  "foil",
  "ornate",
  "double",
  "simple",
  "rounded",
  "dashed",
  "inset",
  "groove",
  "ribbon",
  "none",
];
export const DEFAULT_BORDER_STYLE = "foil";

// The Bismillah line optionally rendered at the very top of a certificate
// (themeJson.showBismillah). Kept as a constant so the card and any builder
// preview share one canonical string.
export const BISMILLAH_TEXT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

// Header logo size.
export const LOGO_SIZES = ["sm", "md", "lg"];
export const DEFAULT_LOGO_SIZE = "md";

// Header logo pixel heights per size (xs / md breakpoints).
export const LOGO_SIZE_PX = {
  sm: { xs: 26, md: 34 },
  md: { xs: 34, md: 46 },
  lg: { xs: 44, md: 60 },
};

// Faint centered watermark behind the content.
export const DEFAULT_SHOW_WATERMARK = true;
export const DEFAULT_WATERMARK_OPACITY = 0.05;
export const WATERMARK_OPACITY_MIN = 0.03;
export const WATERMARK_OPACITY_MAX = 0.15;

// Student-name size multiplier.
export const DEFAULT_NAME_SCALE = 1;
export const NAME_SCALE_MIN = 0.85;
export const NAME_SCALE_MAX = 1.3;

// Heading ("شهادة تقدير") size multiplier.
export const DEFAULT_HEADING_SCALE = 1;
export const HEADING_SCALE_MIN = 0.8;
export const HEADING_SCALE_MAX = 1.4;

// Student-name color (defaults to a deep ink when not set in the theme).
export const DEFAULT_NAME_COLOR = "#1f2a44";

// Content spacing multiplier — loosens/tightens the vertical gaps between the
// certificate's content rows (heading · name · body · congrats · thanks). 1 is
// the tuned default; higher = airier. The landscape auto-fitter then scales the
// whole block to fit, so this stays a RELATIVE breathing-room control.
export const DEFAULT_CONTENT_SPACING = 1;
export const CONTENT_SPACING_MIN = 0.5;
export const CONTENT_SPACING_MAX = 1.8;
