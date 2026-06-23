"use client";

// Kid-friendly, A4-landscape, PRINTABLE certificate.
//
// Every certificate carries the academy brand (logo + "أكاديمية آية لتعليم
// القرآن") in its header and a signature + official-seal footer — game,
// quiz/exam and manual certificates alike.
//
// Reads optional themeJson (string or object) for look & feel:
//   accent / color      → primary accent color
//   background          → hex OR full CSS gradient (GAME certs carry gradients)
//   decoration          → motif: "elegant" | "geometric" | "classic" | "stars"
//                         | "rainbow" | "crescent" | "balloons" | "badges"
//                         (falls back to certificate.templateKey)
//   fontStyle           → "elegant" | "classic" | "modern" (heading/name font)
//   emoji               → emblem glyph
//   titleAr/En          → per-game title embedded in the theme
//   subtitleAr/En       → small line under the title
//   signature           → name on the signature line (default: academy mgmt)
//   showSeal            → render the official seal (default: true)
//   orientation         → "landscape" (default) | "portrait"
//   secondary           → second accent for frames/dividers (default: tint of accent)
//   borderStyle         → "foil" (default) | "double" | "simple" | "none"
//   showTagline         → academy tagline in the header (default: true)
//   showDate            → issue date in the footer (default: true)
//   sealText            → override the seal label (default: localized)
//   signatureTitle      → label under the signature line (default: localized)
//   nameScale           → 0.85–1.3 multiplier for the student-name size (default 1)
//   logoSize            → "sm" | "md" | "lg" header logo size (default "md")
//   showWatermark       → faint centered logo watermark (default: true)
//   watermarkOpacity    → 0.03–0.15 watermark opacity (default 0.05)
//
// The academy logo (header brand + watermark) is painted on EVERY certificate,
// including game/quiz auto-generated ones that carry no themeJson. A missing
// image is hidden gracefully (onError) so the layout never breaks.
//
// The unified "EXAM" style (templateKey === "EXAM" OR type === "QUIZ") overrides
// the motif with a regal, laurel-flanked look. The card paints its OWN white
// surface so it looks identical on screen and on paper; when `printable` is set
// the root carries id="certificate-print" + color-adjust hints.

import { Box, Stack, Typography } from "@mui/material";
import { MdWorkspacePremium, MdSchool } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { useCertificatesText } from "../config/certificatesText.js";
import {
  ACADEMY_LOGO_SRC,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND,
  DEFAULT_BORDER_STYLE,
  DEFAULT_FONT_STYLE,
  DEFAULT_LOGO_SIZE,
  DEFAULT_NAME_SCALE,
  DEFAULT_ORIENTATION,
  DEFAULT_TEMPLATE_KEY,
  DEFAULT_WATERMARK_OPACITY,
  EXAM_TEMPLATE_KEY,
  FONT_STACKS,
  LOGO_SIZE_PX,
  NAME_SCALE_MAX,
  NAME_SCALE_MIN,
  WATERMARK_OPACITY_MAX,
  WATERMARK_OPACITY_MIN,
} from "../config/constant.js";

// Clamp a number into [min, max], falling back to `fallback` for non-numbers.
function clampNum(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// Hide a broken brand/watermark image so the layout never breaks.
function hideOnError(e) {
  e.currentTarget.style.display = "none";
}

function parseTheme(themeJson) {
  if (!themeJson) return {};
  if (typeof themeJson === "object") return themeJson;
  try {
    return JSON.parse(themeJson) || {};
  } catch {
    return {};
  }
}

// True when a string looks like a CSS color-function/gradient (not a hex/keyword).
function isCssBackground(value) {
  return /gradient|rgb|hsl|var\(/i.test(String(value || ""));
}

// Lighten a hex color toward white by `amount` (0..1) — used for soft tints.
// Returns the input unchanged for non-hex values (e.g. gradient strings).
function tint(hex, amount = 0.85) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ""));
  if (!m) return hex;
  const mix = (c) => Math.round(parseInt(c, 16) * (1 - amount) + 255 * amount);
  return `rgb(${mix(m[1])}, ${mix(m[2])}, ${mix(m[3])})`;
}

// Darken a hex color toward black by `amount` (0..1) — for foil/edge contrast.
function shade(hex, amount = 0.25) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ""));
  if (!m) return hex;
  const mix = (c) => Math.round(parseInt(c, 16) * (1 - amount));
  return `rgb(${mix(m[1])}, ${mix(m[2])}, ${mix(m[3])})`;
}

// Build the painted surface from a background value (hex → soft gradient,
// gradient string → used verbatim).
function buildSurface(background) {
  if (isCssBackground(background)) return background;
  return `linear-gradient(135deg, ${tint(background, 0.35)} 0%, ${background} 55%, ${tint(background, 0.15)} 100%)`;
}

// ── Decorative primitives ─────────────────────────────────────────────────────

function Star({ size = 18, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
      </svg>
    </Box>
  );
}

function Dot({ size = 12, color, ...sx }) {
  return (
    <Box
      component="span"
      sx={{ position: "absolute", width: size, height: size, borderRadius: "50%", bgcolor: color, ...sx }}
    />
  );
}

function Balloon({ size = 26, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size * 1.5} viewBox="0 0 24 36" fill="currentColor">
        <ellipse cx="12" cy="11" rx="10" ry="12" />
        <path d="M12 23 L9 27 H15 Z" />
        <path d="M12 27 q3 4 -1 8" stroke={color} strokeWidth="1" fill="none" />
      </svg>
    </Box>
  );
}

function Crescent({ size = 30, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        {/* A crescent: a disc with an offset disc punched out. */}
        <path d="M16.5 3a9 9 0 1 0 4.5 7.8A7 7 0 1 1 16.5 3z" />
      </svg>
    </Box>
  );
}

// A rosette / award badge with a ribbon tail — used for the "badges" motif.
function Badge({ size = 38, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size * 1.4} viewBox="0 0 40 56" fill="none">
        {/* ribbon tails */}
        <path d="M14 30 L11 52 L20 45 L29 52 L26 30 Z" fill={color} opacity="0.85" />
        {/* rosette */}
        <circle cx="20" cy="18" r="15" fill={color} />
        <circle cx="20" cy="18" r="10" fill="#fff" opacity="0.85" />
        <path
          d="M20 11l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"
          fill={color}
        />
      </svg>
    </Box>
  );
}

function RainbowArc({ accent }) {
  const bands = ["#FF6B6B", "#FFA94D", "#FFD43B", "#51CF66", "#4DABF7", accent || "#9775FA"];
  return (
    <Box sx={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", lineHeight: 0, opacity: 0.9 }}>
      <svg width="240" height="120" viewBox="0 0 240 120">
        {bands.map((c, i) => (
          <path
            key={c}
            d={`M ${20 + i * 8} 120 A ${100 - i * 8} ${100 - i * 8} 0 0 1 ${220 - i * 8} 120`}
            fill="none"
            stroke={c}
            strokeWidth="8"
          />
        ))}
      </svg>
    </Box>
  );
}

// An 8-point Islamic star — used for the "geometric" motif.
function EightStar({ size = 30, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path
          d="M24 2 30 12 42 8 38 20 48 24 38 28 42 40 30 36 24 46 18 36 6 40 10 28 0 24 10 20 6 8 18 12Z"
          fill={color}
          opacity="0.9"
        />
        <circle cx="24" cy="24" r="6" fill="#fff" opacity="0.85" />
      </svg>
    </Box>
  );
}

// A corner flourish (filigree swirl) for the "elegant" motif. `corner` is one of
// "tl" | "tr" | "bl" | "br"; the SVG is mirrored/positioned accordingly.
function Flourish({ color, corner = "tl", size = 96 }) {
  const flipX = corner === "tr" || corner === "br";
  const flipY = corner === "bl" || corner === "br";
  const pos = {
    tl: { top: 18, left: 18 },
    tr: { top: 18, right: 18 },
    bl: { bottom: 18, left: 18 },
    br: { bottom: 18, right: 18 },
  }[corner];
  return (
    <Box
      component="span"
      sx={{
        position: "absolute",
        lineHeight: 0,
        color,
        opacity: 0.8,
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
        transformOrigin: "center",
        ...pos,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path
          d="M6 6 C 6 40 22 46 50 48 M6 6 C 40 6 46 22 48 50 M6 6 C 18 18 24 24 30 30"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="50" cy="48" r="2.6" fill={color} />
        <circle cx="48" cy="50" r="2.6" fill={color} />
      </svg>
    </Box>
  );
}

// ── Motif chooser ─────────────────────────────────────────────────────────────

function Decoration({ decoration, accent }) {
  const sec = tint(accent, 0.55);
  switch (decoration) {
    case "stars":
      return (
        <>
          <Star size={22} color={accent} top={18} left={28} />
          <Star size={14} color={sec} top={52} left={64} />
          <Star size={18} color={accent} top={24} right={36} />
          <Star size={12} color={sec} bottom={40} left={40} />
          <Star size={20} color={accent} bottom={26} right={44} />
          <Star size={14} color={sec} bottom={60} right={90} />
        </>
      );
    case "balloons":
      return (
        <>
          <Balloon size={26} color="#FF6B6B" top={16} left={26} />
          <Balloon size={22} color={accent} top={28} left={70} />
          <Balloon size={24} color="#4DABF7" top={18} right={32} />
          <Balloon size={20} color="#FFD43B" top={34} right={74} />
          <Dot size={10} color={sec} bottom={34} left={44} />
          <Dot size={8} color={accent} bottom={50} right={52} />
        </>
      );
    case "rainbow":
      return (
        <>
          <RainbowArc accent={accent} />
          <Dot size={12} color="#FF6B6B" bottom={30} left={36} />
          <Dot size={10} color="#FFD43B" bottom={48} left={64} />
          <Dot size={12} color="#4DABF7" bottom={30} right={36} />
          <Dot size={10} color="#51CF66" bottom={48} right={64} />
        </>
      );
    case "crescent":
      return (
        <>
          <Crescent size={34} color={accent} top={18} left={28} />
          <Star size={12} color="#FFD43B" top={48} left={70} />
          <Star size={10} color={sec} top={28} left={92} />
          <Crescent size={26} color={tint(accent, 0.3)} bottom={26} right={36} />
          <Star size={14} color="#FFD43B" bottom={52} right={78} />
          <Star size={9} color={sec} bottom={36} left={50} />
        </>
      );
    case "badges":
      return (
        <>
          <Badge size={40} color={accent} top={14} left={24} />
          <Badge size={30} color="#FFA94D" top={22} right={30} />
          <Star size={12} color="#FFD43B" top={60} left={72} />
          <Badge size={26} color={tint(accent, 0.25)} bottom={22} left={42} />
          <Star size={11} color="#FFD43B" bottom={48} right={56} />
        </>
      );
    case "geometric":
      return (
        <>
          <EightStar size={30} color={accent} top={16} left={22} />
          <EightStar size={20} color={sec} top={26} left={66} />
          <EightStar size={28} color={accent} top={16} right={22} />
          <EightStar size={18} color={sec} bottom={28} left={48} />
          <EightStar size={30} color={accent} bottom={20} right={24} />
          <EightStar size={18} color={sec} bottom={48} right={80} />
        </>
      );
    case "elegant":
      return (
        <>
          <Flourish color={accent} corner="tl" />
          <Flourish color={accent} corner="tr" />
          <Flourish color={accent} corner="bl" />
          <Flourish color={accent} corner="br" />
        </>
      );
    case "classic":
    default:
      return (
        <>
          <Dot size={14} color={accent} top={24} left={30} />
          <Dot size={9} color={sec} top={46} left={58} />
          <Dot size={14} color={accent} top={24} right={30} />
          <Dot size={9} color={sec} top={46} right={58} />
          <Dot size={12} color={sec} bottom={28} left={48} />
          <Dot size={12} color={sec} bottom={28} right={48} />
        </>
      );
  }
}

// Decorative laurel for the unified EXAM style (mirrored on each side).
function Laurel({ color, flip = false }) {
  return (
    <Box
      component="span"
      sx={{ lineHeight: 0, color, transform: flip ? "scaleX(-1)" : "none", opacity: 0.9 }}
    >
      <svg width="34" height="64" viewBox="0 0 34 64" fill="currentColor">
        <path d="M17 62 C 6 48 4 30 14 8 C 14 26 16 44 17 62 Z" />
        {[12, 22, 32, 42, 52].map((y, i) => (
          <ellipse key={y} cx={9 - i} cy={y} rx="6" ry="3" transform={`rotate(-35 ${9 - i} ${y})`} />
        ))}
      </svg>
    </Box>
  );
}

// Official seal — a double-ring stamp with a star and a short label.
function Seal({ color, label }) {
  return (
    <Box
      sx={{
        width: 70,
        height: 70,
        borderRadius: "50%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color,
        border: `2px solid ${color}`,
        boxShadow: `inset 0 0 0 4px #fff, inset 0 0 0 6px ${tint(color, 0.55)}`,
        transform: "rotate(-8deg)",
        flexShrink: 0,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
      </svg>
      <Box
        component="span"
        sx={{ fontSize: 9, fontWeight: 900, mt: 0.3, letterSpacing: 0.5, lineHeight: 1 }}
      >
        {label}
      </Box>
    </Box>
  );
}

export default function CertificateCard({ certificate, printable = false }) {
  const { lng } = useTranslation();
  const txt = useCertificatesText();
  if (!certificate) return null;

  const theme = parseTheme(certificate.themeJson);
  const accent = theme.accent || theme.color || DEFAULT_ACCENT;
  const background = theme.background || DEFAULT_BACKGROUND;
  const rawDecoration =
    theme.decoration || certificate.templateKey || DEFAULT_TEMPLATE_KEY;

  // A certificate is EXAM-styled when its template/decoration says so, or when
  // the backend typed it as a QUIZ certificate. EXAM overrides everything else.
  const isExam =
    rawDecoration === EXAM_TEMPLATE_KEY ||
    certificate.templateKey === EXAM_TEMPLATE_KEY ||
    certificate.type === "QUIZ";

  // Exam uses a regal accent unless the theme explicitly supplied one.
  const examAccent = theme.accent || theme.color || "#7C4DFF";
  const effectiveAccent = isExam ? examAccent : accent;
  const accentDark = shade(effectiveAccent, 0.28);
  // Secondary accent — explicit, else a soft tint of the primary for frames/dividers.
  const secondary = theme.secondary || tint(effectiveAccent, 0.45);

  // ── Layout / branding options (all optional, with safe defaults) ──
  const isPortrait = theme.orientation === "portrait";
  const borderStyle = theme.borderStyle || DEFAULT_BORDER_STYLE;
  const logoPx = LOGO_SIZE_PX[theme.logoSize] || LOGO_SIZE_PX[DEFAULT_LOGO_SIZE];
  const showWatermark = theme.showWatermark !== false;
  const watermarkOpacity = clampNum(
    theme.watermarkOpacity,
    WATERMARK_OPACITY_MIN,
    WATERMARK_OPACITY_MAX,
    DEFAULT_WATERMARK_OPACITY,
  );
  const nameScale = clampNum(
    theme.nameScale,
    NAME_SCALE_MIN,
    NAME_SCALE_MAX,
    DEFAULT_NAME_SCALE,
  );
  const showTagline = theme.showTagline !== false;
  const showDate = theme.showDate !== false;

  const fontFamily =
    FONT_STACKS[theme.fontStyle] || FONT_STACKS[DEFAULT_FONT_STYLE];

  const emoji = theme.emoji || certificate.emoji || "";

  // Title: prefer the theme-embedded title (per-game look), then the row title,
  // then a sensible localized fallback (the unified exam title for exams).
  const title =
    (lng === "en" ? theme.titleEn : theme.titleAr) ||
    (lng === "en" ? certificate.titleEn : certificate.titleAr) ||
    (isExam ? txt.examTitle : "");
  const subtitle = lng === "en" ? theme.subtitleEn : theme.subtitleAr;
  const body = lng === "en" ? certificate.bodyEn : certificate.bodyAr;
  const studentName = certificate.studentName || certificate.student?.name || "";
  const issued = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString(
        lng === "en" ? "en-GB" : "ar-EG",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : "";

  // showSeal defaults to true unless explicitly disabled.
  const showSeal = theme.showSeal !== false;
  const signature = (theme.signature || "").trim() || txt.defaultSignature;
  const signatureTitle = (theme.signatureTitle || "").trim() || txt.signatureLabel;
  const sealLabel = (theme.sealText || "").trim() || txt.sealText;

  const surface = isExam
    ? `radial-gradient(120% 120% at 50% 0%, ${tint(examAccent, 0.86)} 0%, #fffdfa 55%)`
    : buildSurface(background);

  return (
    <Box
      id={printable ? "certificate-print" : undefined}
      dir={lng === "en" ? "ltr" : "rtl"}
      sx={{
        // A4 proportion (√2 : 1). Landscape by default; portrait flips it.
        // Scales down to fit the dialog/card.
        width: "100%",
        maxWidth: isPortrait ? 660 : 920,
        mx: "auto",
        aspectRatio: isPortrait ? "210 / 297" : "297 / 210",
        position: "relative",
        borderRadius: 4,
        p: { xs: 1.5, sm: 2.5, md: 3 },
        background: surface,
        color: "#25313F",
        boxShadow: 6,
        overflow: "hidden",
        // Keep the colorful look when printing.
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Frame — treatment depends on borderStyle (exam keeps its regal foil). */}
      {(isExam || borderStyle !== "none") && (
        <Box
          sx={{
            position: "absolute",
            inset: 10,
            borderRadius: 3,
            border:
              isExam || borderStyle === "foil"
                ? `${isExam ? 4 : 5}px solid ${effectiveAccent}`
                : borderStyle === "double"
                  ? `3px double ${effectiveAccent}`
                  : `2px solid ${effectiveAccent}`,
            boxShadow:
              isExam || borderStyle === "foil"
                ? `inset 0 0 0 2px ${secondary}`
                : "none",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Inner hairline — only for the richer frame styles. */}
      {(isExam || borderStyle === "foil" || borderStyle === "double") && (
        <Box
          sx={{
            position: "absolute",
            inset: 22,
            borderRadius: 2,
            border: isExam
              ? `1px solid ${effectiveAccent}`
              : `1.5px dashed ${secondary}`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Subtle centered watermark (the academy logo) behind everything.
          Painted on every certificate unless explicitly disabled. */}
      {showWatermark && (
        <Box
          component="img"
          src={ACADEMY_LOGO_SRC}
          alt=""
          aria-hidden
          onError={hideOnError}
          sx={{
            position: "absolute",
            top: "52%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isPortrait ? "62%" : "46%",
            maxWidth: 320,
            opacity: watermarkOpacity,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      )}

      {/* Playful / ornamental motif behind the content (non-exam only). */}
      {!isExam && <Decoration decoration={rawDecoration} accent={effectiveAccent} />}

      {/* Corner scallops (skipped for the frame-less style). */}
      {(isExam || borderStyle !== "none") &&
        [
          { top: 16, left: 16 },
          { top: 16, right: 16 },
          { bottom: 16, left: 16 },
          { bottom: 16, right: 16 },
        ].map((pos, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: `3px solid ${effectiveAccent}`,
              opacity: isExam ? 0.35 : 0.45,
              ...pos,
            }}
          />
        ))}

      {/* Three-row layout: brand · content · footer. */}
      <Stack
        sx={{
          position: "relative",
          height: "100%",
          px: { xs: 2, md: 5 },
          py: { xs: 1, md: 1.5 },
          textAlign: "center",
        }}
      >
        {/* ── Academy brand (on every certificate) ── */}
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          justifyContent="center"
        >
          <Box
            component="img"
            src={ACADEMY_LOGO_SRC}
            alt={txt.academyName}
            onError={hideOnError}
            sx={{
              height: { xs: logoPx.xs, md: logoPx.md },
              width: "auto",
              objectFit: "contain",
              // Crisper rendering when the source is scaled.
              imageRendering: "auto",
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.12))",
            }}
          />
          <Box sx={{ textAlign: lng === "en" ? "left" : "right" }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: 13, md: 16 },
                lineHeight: 1.1,
                color: accentDark,
              }}
            >
              {txt.academyName}
            </Typography>
            {showTagline && (
              <Typography
                sx={{
                  fontSize: { xs: 9, md: 10.5 },
                  color: "text.secondary",
                  lineHeight: 1.1,
                }}
              >
                {txt.academyTagline}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Header divider flourish for separation from the content. */}
        <Box
          sx={{
            mt: 0.5,
            mx: "auto",
            width: { xs: 120, md: 180 },
            height: 2,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${secondary}, transparent)`,
          }}
        />

        {/* ── Main content ── */}
        <Stack
          spacing={0.6}
          alignItems="center"
          justifyContent="center"
          sx={{ flexGrow: 1, minHeight: 0 }}
        >
          {/* Emblem: emoji bubble, exam mortarboard, or default medal. */}
          <Box
            sx={{
              color: "#fff",
              background: `linear-gradient(135deg, ${tint(effectiveAccent, 0.15)}, ${effectiveAccent})`,
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              boxShadow: `0 0 0 5px ${tint(effectiveAccent, 0.72)}`,
            }}
          >
            {emoji ? (
              <Box component="span" sx={{ lineHeight: 1 }}>
                {emoji}
              </Box>
            ) : isExam ? (
              <MdSchool size={38} />
            ) : (
              <MdWorkspacePremium size={38} />
            )}
          </Box>

          {/* Header line — exam flanks it with laurels. */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isExam && <Laurel color={effectiveAccent} />}
            <Typography
              variant="h5"
              fontWeight={900}
              sx={{ color: effectiveAccent, letterSpacing: 1.5, lineHeight: 1.1, fontFamily }}
            >
              {txt.certificateOf}
            </Typography>
            {isExam && <Laurel color={effectiveAccent} flip />}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {txt.awardedTo}
          </Typography>

          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              fontFamily,
              lineHeight: 1.05,
              color: "#1f2a44",
              fontSize: {
                xs: `calc(1.6rem * ${nameScale})`,
                md: `calc(3rem * ${nameScale})`,
              },
            }}
          >
            {studentName}
          </Typography>

          {/* Ribbon flourish under the name: a center pill with two tapered tails. */}
          <Box
            sx={{
              position: "relative",
              my: 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 200,
              maxWidth: "70%",
            }}
          >
            <Box
              sx={{
                flex: 1,
                height: 2,
                borderRadius: 2,
                background: `linear-gradient(90deg, transparent, ${effectiveAccent})`,
              }}
            />
            <Box
              sx={{
                width: 10,
                height: 10,
                mx: 0.75,
                borderRadius: "50%",
                bgcolor: effectiveAccent,
                boxShadow: `0 0 0 3px ${tint(effectiveAccent, 0.7)}`,
                flexShrink: 0,
              }}
            />
            <Box
              sx={{
                flex: 1,
                height: 2,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${effectiveAccent}, transparent)`,
              }}
            />
          </Box>

          {title && (
            <Typography variant="subtitle1" fontWeight={700}>
              {txt.forText} {title}
            </Typography>
          )}

          {subtitle && (
            <Typography variant="body2" sx={{ color: accentDark, fontWeight: 600 }}>
              {subtitle}
            </Typography>
          )}

          {body && (
            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 560 }}>
              {body}
            </Typography>
          )}
        </Stack>

        {/* ── Footer: date · seal · signature ── */}
        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 0.5 }}
        >
          {/* Issue date */}
          <Box sx={{ minWidth: 120, textAlign: lng === "en" ? "left" : "right" }}>
            {showDate && issued && (
              <Typography variant="caption" sx={{ color: accentDark, fontWeight: 700, display: "block" }}>
                {txt.issuedOn}
              </Typography>
            )}
            {showDate && issued && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {issued}
              </Typography>
            )}
          </Box>

          {/* Seal (centered) */}
          {showSeal ? <Seal color={effectiveAccent} label={sealLabel} /> : <Box />}

          {/* Signature */}
          <Box sx={{ minWidth: 140, textAlign: "center" }}>
            <Box
              sx={{
                borderTop: `1.5px solid ${shade(effectiveAccent, 0.15)}`,
                pt: 0.4,
                mb: 0.2,
                fontFamily,
                fontWeight: 800,
                fontSize: 14,
                color: "#1f2a44",
              }}
            >
              {signature}
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {signatureTitle}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
