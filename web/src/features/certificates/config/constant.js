export const CERTIFICATES_URL = "certificates";
export const CERTIFICATE_TEMPLATES_URL = "certificate-templates";

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
];

// Selectable in the admin create dialog (the named decorations + EXAM + the
// safe default). EXAM forces the unified exam look regardless of other choices.
export const TEMPLATE_KEYS = [...DECORATION_KEYS, "EXAM"];

// The unified exam/quiz template key (mirrors @aya/shared CERTIFICATE_TEMPLATE_KEYS.EXAM).
export const EXAM_TEMPLATE_KEY = "EXAM";

// Heading / name font styles the card supports (stored as themeJson.fontStyle).
export const FONT_STYLES = ["elegant", "classic", "modern"];
export const DEFAULT_FONT_STYLE = "elegant";

// CSS font stacks per fontStyle. Arabic-safe (no latin-only script fonts).
export const FONT_STACKS = {
  elegant: `"Georgia", "Amiri", "Scheherazade New", "Times New Roman", serif`,
  classic: `"Times New Roman", "Amiri", serif`,
  modern: `inherit`,
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
export const BORDER_STYLES = ["foil", "ornate", "double", "simple", "none"];
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
