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

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { MdWorkspacePremium, MdSchool, MdPerson } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { buildFileUrl } from "../../../shared/lib/fileUrl.js";
import { useCertificatesText } from "../config/certificatesText.js";
import {
  ACADEMY_LOGO_SRC,
  BISMILLAH_TEXT,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND,
  DEFAULT_BORDER_STYLE,
  DEFAULT_FONT_STYLE,
  CONTENT_SPACING_MAX,
  CONTENT_SPACING_MIN,
  DEFAULT_CONTENT_SPACING,
  DEFAULT_HEADING_SCALE,
  DEFAULT_LOGO_SIZE,
  DEFAULT_NAME_COLOR,
  DEFAULT_NAME_SCALE,
  DEFAULT_TEMPLATE_KEY,
  DEFAULT_WATERMARK_OPACITY,
  EXAM_TEMPLATE_KEY,
  FONT_STACKS,
  HEADING_SCALE_MAX,
  HEADING_SCALE_MIN,
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

// Resolve a borderStyle (and the exam override) into the concrete frame CSS the
// card paints: the outer rule (inset 10), an optional inner hairline (inset 22),
// and whether to add the round corner scallops. "ornate" and "none" are handled
// separately by the caller and never reach here.
function buildFrame({ style, isExam, accent, secondary }) {
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

// A heart — used for the "hearts" motif.
function Heart({ size = 22, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21s-7.5-4.6-10-9.2C.5 8.5 2 5 5.5 5 8 5 9.5 6.8 12 9c2.5-2.2 4-4 6.5-4C22 5 23.5 8.5 22 11.8 19.5 16.4 12 21 12 21z" />
      </svg>
    </Box>
  );
}

// A four-point sparkle — used for the "sparkles" motif.
function Sparkle({ size = 22, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0 C 13 8 16 11 24 12 C 16 13 13 16 12 24 C 11 16 8 13 0 12 C 8 11 11 8 12 0 Z" />
      </svg>
    </Box>
  );
}

// A small confetti rectangle (rotated) — used for the "confetti" motif.
function Confetti({ size = 12, color, rotate = 0, ...sx }) {
  return (
    <Box
      component="span"
      sx={{
        position: "absolute",
        width: size,
        height: size * 0.5,
        borderRadius: 0.5,
        bgcolor: color,
        transform: `rotate(${rotate}deg)`,
        ...sx,
      }}
    />
  );
}

// A Ramadan-style lantern (فانوس) — used for the "lanterns" motif.
function Lantern({ size = 30, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size * 1.6} viewBox="0 0 30 48" fill="none">
        <line x1="15" y1="0" x2="15" y2="6" stroke={color} strokeWidth="1.5" />
        <path d="M9 7 H21 L19 11 H11 Z" fill={color} />
        <rect x="7" y="11" width="16" height="22" rx="3" fill={color} opacity="0.9" />
        <rect x="10.5" y="14" width="9" height="16" rx="2" fill="#fff" opacity="0.8" />
        <path d="M11 33 H19 L17 38 H13 Z" fill={color} />
        <circle cx="15" cy="40" r="2.4" fill={color} />
      </svg>
    </Box>
  );
}

// A simple five-petal flower — used for the "florals" motif.
function Flower({ size = 30, color, core, ...sx }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        {petals.map((a) => (
          <ellipse
            key={a}
            cx="20"
            cy="9"
            rx="6"
            ry="10"
            fill={color}
            opacity="0.9"
            transform={`rotate(${a} 20 20)`}
          />
        ))}
        <circle cx="20" cy="20" r="6" fill={core || "#fff"} />
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

// ── Ornate (Islamic) frame primitives ─────────────────────────────────────────

// A single arabesque corner motif (interlaced leaf/swirl). Mirrored per corner.
function ArabesqueCorner({ accent, gold, corner = "tl", size = 116 }) {
  const flipX = corner === "tr" || corner === "br";
  const flipY = corner === "bl" || corner === "br";
  const pos = {
    tl: { top: 26, left: 26 },
    tr: { top: 26, right: 26 },
    bl: { bottom: 26, left: 26 },
    br: { bottom: 26, right: 26 },
  }[corner];
  return (
    <Box
      component="span"
      sx={{
        position: "absolute",
        lineHeight: 0,
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
        transformOrigin: "center",
        pointerEvents: "none",
        ...pos,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        {/* Outer sweeping vine */}
        <path
          d="M4 4 C 4 46 26 60 70 64 M4 4 C 46 4 60 26 64 70"
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Inner gold vine */}
        <path
          d="M14 14 C 14 44 30 54 60 58 M14 14 C 44 14 54 30 58 60"
          stroke={gold}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Leaf buds */}
        <path d="M64 70 q14 2 18 16 q-16 -2 -18 -16Z" fill={accent} opacity="0.9" />
        <path d="M70 64 q2 14 16 18 q-2 -16 -16 -18Z" fill={accent} opacity="0.9" />
        <circle cx="60" cy="58" r="4" fill={gold} />
        <circle cx="8" cy="8" r="3.5" fill={gold} />
        {/* Small accent petals near the corner */}
        <path
          d="M30 30 q8 -6 14 0 q-6 8 -14 0Z"
          fill={gold}
          opacity="0.85"
        />
      </svg>
    </Box>
  );
}

// The ornate green/gold frame: layered borders + a subtle geometric pattern
// band + arabesque corners. Painted absolutely behind the content.
function OrnateFrame({ accent, gold }) {
  const patternId = "ornate-geo";
  return (
    <>
      {/* Subtle geometric pattern wash across the whole surface. */}
      <Box
        component="svg"
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern id={patternId} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path
              d="M17 1 L33 17 L17 33 L1 17 Z"
              fill="none"
              stroke={accent}
              strokeWidth="1.4"
            />
            <circle cx="17" cy="17" r="3" fill={gold} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Box>

      {/* Layered borders. */}
      <Box sx={{ position: "absolute", inset: 8, borderRadius: 3, border: `6px solid ${accent}`, pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", inset: 16, borderRadius: 2.5, border: `2px solid ${gold}`, pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", inset: 22, borderRadius: 2, border: `1px solid ${accent}`, pointerEvents: "none" }} />

      {/* Arabesque corner motifs. */}
      <ArabesqueCorner accent={accent} gold={gold} corner="tl" />
      <ArabesqueCorner accent={accent} gold={gold} corner="tr" />
      <ArabesqueCorner accent={accent} gold={gold} corner="bl" />
      <ArabesqueCorner accent={accent} gold={gold} corner="br" />
    </>
  );
}

// Circular student photo (or a neutral placeholder when none / on error).
function StudentPhoto({ src, accent, gold }) {
  return (
    <Box
      sx={{
        width: 86,
        height: 86,
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: tint(accent, 0.85),
        color: tint(accent, 0.2),
        border: `3px solid ${accent}`,
        boxShadow: `0 0 0 3px ${gold}`,
        flexShrink: 0,
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt=""
          onError={hideOnError}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <MdPerson size={46} />
      )}
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
    case "confetti":
      return (
        <>
          <Confetti size={14} color="#FF6B6B" rotate={20} top={18} left={30} />
          <Confetti size={12} color={accent} rotate={-30} top={40} left={70} />
          <Confetti size={13} color="#4DABF7" rotate={45} top={22} right={40} />
          <Confetti size={11} color="#FFD43B" rotate={-15} top={54} right={84} />
          <Dot size={8} color="#51CF66" top={70} left={120} />
          <Confetti size={13} color="#9775FA" rotate={30} bottom={30} left={44} />
          <Confetti size={12} color={sec} rotate={-25} bottom={50} left={96} />
          <Confetti size={13} color="#FFA94D" rotate={15} bottom={28} right={48} />
          <Dot size={9} color="#FF6B6B" bottom={56} right={96} />
        </>
      );
    case "hearts":
      return (
        <>
          <Heart size={24} color="#E0457B" top={16} left={28} />
          <Heart size={16} color={accent} top={48} left={70} />
          <Heart size={20} color="#FF6B6B" top={20} right={34} />
          <Heart size={14} color={sec} bottom={40} left={46} />
          <Heart size={22} color="#E0457B" bottom={24} right={42} />
          <Heart size={14} color={accent} bottom={58} right={92} />
        </>
      );
    case "lanterns":
      return (
        <>
          <Lantern size={30} color={accent} top={12} left={26} />
          <Lantern size={22} color={sec} top={20} left={72} />
          <Lantern size={26} color={accent} top={12} right={32} />
          <Star size={12} color="#FFD43B" top={64} left={120} />
          <Lantern size={22} color={tint(accent, 0.25)} bottom={20} right={40} />
          <Star size={11} color="#FFD43B" bottom={50} left={60} />
        </>
      );
    case "florals":
      return (
        <>
          <Flower size={34} color={accent} core={sec} top={16} left={24} />
          <Flower size={22} color={sec} core="#fff" top={26} left={70} />
          <Flower size={30} color={accent} core={sec} top={16} right={26} />
          <Flower size={20} color={tint(accent, 0.3)} core="#fff" bottom={28} left={50} />
          <Flower size={32} color={accent} core={sec} bottom={20} right={26} />
          <Flower size={20} color={sec} core="#fff" bottom={50} right={84} />
        </>
      );
    case "sparkles":
      return (
        <>
          <Sparkle size={24} color={sec} top={16} left={28} />
          <Sparkle size={14} color={accent} top={48} left={66} />
          <Sparkle size={20} color={sec} top={22} right={34} />
          <Sparkle size={12} color={accent} bottom={44} left={48} />
          <Sparkle size={22} color={sec} bottom={24} right={40} />
          <Sparkle size={14} color={accent} bottom={58} right={92} />
        </>
      );
    case "none":
      return null;
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

// In landscape the A4 box is short, but a certificate can carry a LOT of optional
// content (bismillah + brand + photo + heading + name + body + congrats + thanks
// + footer). Rather than let it overflow and clip (the old bug: pieces landing on
// top of each other), we render the content at a fixed design width and SCALE the
// whole block down so it always fits the available box — nothing is ever cut off.
//
// Portrait already has the vertical room, so it is rendered untouched (the look
// the academy is happy with); only landscape goes through the fitter.
const LANDSCAPE_DESIGN_W = 840; // px — the design canvas width landscape lays out at
const LANDSCAPE_DESIGN_H = 594; // px — A4 landscape height for 840w (840 × 210/297)
const FIT_INSET = 26; // px — keep scaled content clear of the decorative frame

// useLayoutEffect on the server (SSR) logs a warning; fall back to useEffect there.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Measures its own box + the natural size of its child and scales the child to
// fit (never upscales past 1). Re-measures on any size change (incl. web-font
// swap, which changes text height) via a ResizeObserver on both nodes.
function FitToBoxInner({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useIsoLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;

    const measure = () => {
      const availW = outer.clientWidth;
      const availH = outer.clientHeight;
      // offsetWidth/Height are the PRE-transform layout size, so reading them
      // while a scale() is applied is stable (no measurement feedback loop).
      const natW = inner.offsetWidth;
      const natH = inner.offsetHeight;
      if (!availW || !availH || !natW || !natH) return;
      const next = Math.min(1, availW / natW, availH / natH);
      setScale((prev) => (Math.abs(prev - next) > 0.004 ? next : prev));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <Box
      ref={outerRef}
      sx={{
        position: "absolute",
        inset: `${FIT_INSET}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Box
        ref={innerRef}
        sx={{
          flexShrink: 0,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// Wraps the certificate body in the auto-fitter for landscape; passes it through
// untouched for portrait (which has the room and is rendered at full size).
function FitToBox({ enabled, children }) {
  if (!enabled) return children;
  return <FitToBoxInner>{children}</FitToBoxInner>;
}

export default function CertificateCard({ certificate, printable = false }) {
  const { lng } = useTranslation();
  const txt = useCertificatesText();
  if (!certificate) return null;

  // Template-driven certificates carry a `template` object with the fixed copy
  // and its own themeJson. The template style is the BASE; the certificate's own
  // themeJson overrides it (so per-cert tweaks still win).
  const tpl = certificate.template || null;
  const isTemplate = Boolean(tpl);
  const certTheme = parseTheme(certificate.themeJson);
  const tplTheme = parseTheme(tpl?.themeJson);
  const theme = isTemplate ? { ...tplTheme, ...certTheme } : certTheme;

  const accent = theme.accent || theme.color || DEFAULT_ACCENT;
  const background = theme.background || DEFAULT_BACKGROUND;
  const rawDecoration =
    theme.decoration || certificate.templateKey || DEFAULT_TEMPLATE_KEY;

  // A certificate is EXAM-styled when its template/decoration says so, or when
  // the backend typed it as a QUIZ certificate. EXAM overrides everything else.
  // Template-driven certificates never use the EXAM look.
  const isExam =
    !isTemplate &&
    (rawDecoration === EXAM_TEMPLATE_KEY ||
      certificate.templateKey === EXAM_TEMPLATE_KEY ||
      certificate.type === "QUIZ");

  // Exam uses a regal accent unless the theme explicitly supplied one.
  const examAccent = theme.accent || theme.color || "#7C4DFF";
  const effectiveAccent = isExam ? examAccent : accent;
  const accentDark = shade(effectiveAccent, 0.28);
  // Secondary accent — explicit, else a soft tint of the primary for frames/dividers.
  const secondary = theme.secondary || tint(effectiveAccent, 0.45);

  // ── Layout / branding options (all optional, with safe defaults) ──
  const isPortrait = theme.orientation === "portrait";

  // Font/size helper. Portrait keeps the responsive {xs, md} sizes (it renders at
  // the real container width). Landscape renders inside the auto-fitter at a fixed
  // design width, so it must use DETERMINISTIC fixed sizes (the md value) — the
  // fitter then scales the whole block to the actual box.
  const fz = (xs, md) => (isPortrait ? { xs, md } : md);
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
  const headingScale = clampNum(
    theme.headingScale,
    HEADING_SCALE_MIN,
    HEADING_SCALE_MAX,
    DEFAULT_HEADING_SCALE,
  );
  // Student-name color (explicit override, else the deep-ink default).
  const nameColor = theme.nameColor || DEFAULT_NAME_COLOR;
  const showTagline = theme.showTagline !== false;
  const showDate = theme.showDate !== false;
  // Vertical breathing room between content rows (admin-tunable).
  const contentSpacing = clampNum(
    theme.contentSpacing,
    CONTENT_SPACING_MIN,
    CONTENT_SPACING_MAX,
    DEFAULT_CONTENT_SPACING,
  );

  const fontFamily =
    FONT_STACKS[theme.fontStyle] || FONT_STACKS[DEFAULT_FONT_STYLE];

  const emoji = theme.emoji || certificate.emoji || "";

  const en = lng === "en";
  const pick = (ar2, en2) => (en ? en2 : ar2);

  // Reason (the dynamic purpose of a template certificate, e.g. "حفظ التشهد").
  const reason = pick(certificate.reasonAr, certificate.reasonEn) || "";

  // ── Content: template-driven vs free-form ──
  let heading = "";
  let intro = "";
  let title = "";
  let subtitle = "";
  let body = "";
  let congrats = "";
  let thanks = "";

  if (isTemplate) {
    heading = pick(tpl.headingAr, tpl.headingEn) || txt.certificateOf;
    intro = pick(tpl.introAr, tpl.introEn) || "";
    congrats = pick(tpl.congratsAr, tpl.congratsEn) || "";
    thanks = pick(tpl.thanksAr, tpl.thanksEn) || "";
    // Body: substitute the {reason} token; if the token is absent, append the
    // reason on its own line.
    const rawBody = pick(tpl.bodyAr, tpl.bodyEn) || "";
    if (rawBody.includes("{reason}")) {
      body = rawBody.replace(/\{reason\}/g, reason);
    } else if (reason) {
      body = rawBody ? `${rawBody}\n${reason}` : reason;
    } else {
      body = rawBody;
    }
  } else {
    // Title: prefer the theme-embedded title (per-game look), then the row title,
    // then a sensible localized fallback (the unified exam title for exams).
    title =
      (en ? theme.titleEn : theme.titleAr) ||
      (en ? certificate.titleEn : certificate.titleAr) ||
      (isExam ? txt.examTitle : "");
    subtitle = en ? theme.subtitleEn : theme.subtitleAr;
    body = en ? certificate.bodyEn : certificate.bodyAr;
    heading = txt.certificateOf;
  }

  const studentName = certificate.studentName || certificate.student?.name || "";
  const issued = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString(
        en ? "en-GB" : "ar-EG",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : "";

  // showSeal defaults to true unless explicitly disabled.
  const showSeal = theme.showSeal !== false;
  // Signature: template signatureName/Title take precedence for template certs.
  const tplSignature = isTemplate ? (tpl.signatureName || "").trim() : "";
  const tplSignatureTitle = isTemplate
    ? (pick(tpl.signatureTitleAr, tpl.signatureTitleEn) || "").trim()
    : "";
  const signature =
    tplSignature || (theme.signature || "").trim() || txt.defaultSignature;
  const signatureTitle =
    tplSignatureTitle || (theme.signatureTitle || "").trim() || txt.signatureLabel;
  const sealLabel = (theme.sealText || "").trim() || txt.sealText;

  // ── Ornate / photo / bismillah (template-aware, but theme-driven) ──
  const isOrnate = borderStyle === "ornate";
  const isFramed = isExam || (!isOrnate && borderStyle !== "none");
  const frame = isFramed
    ? buildFrame({ style: borderStyle, isExam, accent: effectiveAccent, secondary })
    : null;
  const ornateGold = theme.secondary || "#C9A227";
  const showBismillah = theme.showBismillah === true;
  const showPhoto = theme.showPhoto === true;
  // Pass the attachment OBJECT (with id) so buildFileUrl can use the
  // authenticated raw route, not the (now non-public) stored url.
  const photoUrl = showPhoto
    ? buildFileUrl(certificate.photo || certificate.student?.avatar)
    : null;

  const surface = isExam
    ? `radial-gradient(120% 120% at 50% 0%, ${tint(examAccent, 0.86)} 0%, #fffdfa 55%)`
    : buildSurface(background);

  // ── Landscape two-column pieces ────────────────────────────────────────────
  // Portrait keeps its classic single column (rendered inline below, unchanged).
  // Landscape is short, so a single column had to shrink to fit → tiny type. The
  // two-column layout (content · credential) uses the wide axis instead, laid out
  // at a fixed design canvas and auto-fitted, so the type stays large.
  const headerNode = (
    <>
      {showBismillah && (
        <Typography
          sx={{
            fontFamily,
            fontWeight: 700,
            color: accentDark,
            fontSize: fz(13, 17),
            lineHeight: 1.2,
            mb: 0.25,
          }}
        >
          {BISMILLAH_TEXT}
        </Typography>
      )}
      <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center">
        <Box
          component="img"
          src={ACADEMY_LOGO_SRC}
          alt={txt.academyName}
          onError={hideOnError}
          sx={{
            height: fz(logoPx.xs, logoPx.md),
            width: "auto",
            objectFit: "contain",
            imageRendering: "auto",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.12))",
          }}
        />
        <Box sx={{ textAlign: lng === "en" ? "left" : "right" }}>
          <Typography
            sx={{
              fontFamily,
              fontWeight: 900,
              fontSize: fz(13, 16),
              lineHeight: 1.1,
              color: accentDark,
            }}
          >
            {txt.academyName}
          </Typography>
          {showTagline && (
            <Typography
              sx={{
                fontFamily,
                fontSize: fz(9, 10.5),
                color: "text.secondary",
                lineHeight: 1.1,
              }}
            >
              {txt.academyTagline}
            </Typography>
          )}
        </Box>
      </Stack>
      <Box
        sx={{
          mt: 0.5,
          mx: "auto",
          width: fz(120, 180),
          height: 2,
          borderRadius: 2,
          background: `linear-gradient(90deg, transparent, ${secondary}, transparent)`,
        }}
      />
    </>
  );

  const photoNode = showPhoto ? (
    <StudentPhoto src={photoUrl} accent={effectiveAccent} gold={ornateGold} />
  ) : (
    <Box
      sx={{
        color: "#fff",
        background: `linear-gradient(135deg, ${tint(effectiveAccent, 0.15)}, ${effectiveAccent})`,
        width: 72,
        height: 72,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 38,
        boxShadow: `0 0 0 5px ${tint(effectiveAccent, 0.72)}`,
      }}
    >
      {emoji ? (
        <Box component="span" sx={{ lineHeight: 1 }}>
          {emoji}
        </Box>
      ) : isExam ? (
        <MdSchool size={42} />
      ) : (
        <MdWorkspacePremium size={42} />
      )}
    </Box>
  );

  const textBlock = (
    <>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {isExam && <Laurel color={effectiveAccent} />}
        <Typography
          variant="h5"
          fontWeight={900}
          sx={{
            color: effectiveAccent,
            letterSpacing: 1.5,
            lineHeight: 1.1,
            fontFamily,
            fontSize: `calc(1.7rem * ${headingScale})`,
          }}
        >
          {heading}
        </Typography>
        {isExam && <Laurel color={effectiveAccent} flip />}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ fontFamily }}>
        {intro || txt.awardedTo}
      </Typography>

      <Typography
        fontWeight={900}
        sx={{
          fontFamily,
          lineHeight: 1.05,
          color: nameColor,
          fontSize: `calc(3.1rem * ${nameScale})`,
        }}
      >
        {studentName}
      </Typography>

      <Box
        sx={{
          position: "relative",
          my: 0.4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 220,
          maxWidth: "75%",
        }}
      >
        <Box sx={{ flex: 1, height: 2, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${effectiveAccent})` }} />
        <Box sx={{ width: 10, height: 10, mx: 0.75, borderRadius: "50%", bgcolor: effectiveAccent, boxShadow: `0 0 0 3px ${tint(effectiveAccent, 0.7)}`, flexShrink: 0 }} />
        <Box sx={{ flex: 1, height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${effectiveAccent}, transparent)` }} />
      </Box>

      {title && (
        <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily }}>
          {txt.forText} {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" sx={{ color: accentDark, fontWeight: 600, fontFamily }}>
          {subtitle}
        </Typography>
      )}
      {body && (
        <Typography
          color="text.secondary"
          sx={{ fontFamily, fontSize: 15, maxWidth: 460, whiteSpace: "pre-line", lineHeight: 1.55 }}
        >
          {body}
        </Typography>
      )}
      {congrats && (
        <Typography variant="subtitle1" sx={{ color: effectiveAccent, fontWeight: 800, fontFamily, mt: 0.2 }}>
          {congrats}
        </Typography>
      )}
      {thanks && (
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily, maxWidth: 460 }}>
          {thanks}
        </Typography>
      )}
    </>
  );

  const sealNode = showSeal ? <Seal color={effectiveAccent} label={sealLabel} /> : null;

  const signatureBlock = (
    <Box sx={{ minWidth: 140, maxWidth: "100%", textAlign: "center" }}>
      <Box
        sx={{
          borderTop: `1.5px solid ${shade(effectiveAccent, 0.15)}`,
          pt: 0.4,
          mb: 0.2,
          fontFamily,
          fontWeight: 800,
          fontSize: 15,
          color: "#1f2a44",
        }}
      >
        {signature}
      </Box>
      <Typography variant="caption" sx={{ fontFamily, color: "text.secondary" }}>
        {signatureTitle}
      </Typography>
    </Box>
  );

  const dateBlock =
    showDate && issued ? (
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="caption" sx={{ fontFamily, color: accentDark, fontWeight: 700, display: "block" }}>
          {txt.issuedOn}
        </Typography>
        <Typography variant="caption" sx={{ fontFamily, color: "text.secondary" }}>
          {issued}
        </Typography>
      </Box>
    ) : null;

  // Header band on top; below it two columns: content (leading) · credential.
  const landscapeBody = (
    <Stack
      sx={{
        position: "relative",
        width: LANDSCAPE_DESIGN_W,
        height: LANDSCAPE_DESIGN_H,
        px: 4,
        py: 2.5,
        textAlign: "center",
      }}
    >
      {headerNode}
      <Stack
        direction="row"
        alignItems="stretch"
        spacing={2.5}
        sx={{ flexGrow: 1, minHeight: 0, mt: 1 }}
      >
        {/* Content column */}
        <Stack
          spacing={0.7 * contentSpacing}
          alignItems="center"
          justifyContent="center"
          sx={{ flex: 1, minWidth: 0 }}
        >
          {textBlock}
        </Stack>
        {/* Vertical divider */}
        <Box
          sx={{
            width: 2,
            alignSelf: "stretch",
            my: 1,
            borderRadius: 2,
            background: `linear-gradient(180deg, transparent, ${secondary}, transparent)`,
          }}
        />
        {/* Credential column: photo · seal · signature · date */}
        <Stack
          alignItems="center"
          justifyContent="space-around"
          spacing={1}
          sx={{ flex: "0 0 36%", minWidth: 0, py: 1 }}
        >
          {photoNode}
          {sealNode}
          {signatureBlock}
          {dateBlock}
        </Stack>
      </Stack>
    </Stack>
  );

  return (
    <Box
      id={printable ? "certificate-print" : undefined}
      data-certificate-root=""
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
        // Portrait keeps its own padding; landscape lets the auto-fitter own the
        // inset so scaled content can use the full inner box.
        p: isPortrait ? { xs: 1.5, sm: 2.5, md: 3 } : 0,
        background: surface,
        color: "#25313F",
        boxShadow: 6,
        overflow: "hidden",
        // Keep the colorful look when printing.
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Ornate Islamic frame — its own layered borders + corner arabesques. */}
      {!isExam && isOrnate && (
        <OrnateFrame accent={effectiveAccent} gold={ornateGold} />
      )}

      {/* Frame — treatment depends on borderStyle (exam keeps its regal foil). */}
      {frame && (
        <Box
          sx={{
            position: "absolute",
            inset: 10,
            borderRadius: frame.radius,
            border: frame.border,
            boxShadow: frame.boxShadow,
            pointerEvents: "none",
          }}
        />
      )}
      {/* Inner hairline — only for the richer frame styles. */}
      {frame?.hairline && (
        <Box
          sx={{
            position: "absolute",
            inset: 22,
            borderRadius: frame.hairline.radius,
            border: frame.hairline.border,
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

      {/* Playful / ornamental motif behind the content. Painted for every
          non-exam style INCLUDING the ornate frame, so changing the decoration
          always shows in the preview (the ornate frame only draws its borders +
          corner arabesques; the motif sits over the surface). */}
      {!isExam && (
        <Decoration decoration={rawDecoration} accent={effectiveAccent} />
      )}

      {/* Corner scallops (only for the richer frame styles). */}
      {frame?.scallop &&
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

      {/* Body — portrait keeps its classic single column (below); landscape uses
          the two-column landscapeBody, auto-fitted so the type stays large. */}
      {isPortrait ? (
      <Stack
        sx={{
          position: "relative",
          height: "100%",
          px: { xs: 2, md: 5 },
          py: { xs: 1, md: 1.5 },
          textAlign: "center",
        }}
      >
        {/* Optional Bismillah line at the very top. */}
        {showBismillah && (
          <Typography
            sx={{
              fontFamily,
              fontWeight: 700,
              color: accentDark,
              fontSize: fz(13, 17),
              lineHeight: 1.2,
              mb: 0.25,
            }}
          >
            {BISMILLAH_TEXT}
          </Typography>
        )}

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
              height: fz(logoPx.xs, logoPx.md),
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
                fontFamily,
                fontWeight: 900,
                fontSize: fz(13, 16),
                lineHeight: 1.1,
                color: accentDark,
              }}
            >
              {txt.academyName}
            </Typography>
            {showTagline && (
              <Typography
                sx={{
                  fontFamily,
                  fontSize: fz(9, 10.5),
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
            width: fz(120, 180),
            height: 2,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${secondary}, transparent)`,
          }}
        />

        {/* ── Main content ── */}
        <Stack
          spacing={0.6 * contentSpacing}
          alignItems="center"
          justifyContent="center"
          sx={{ flexGrow: 1, minHeight: 0 }}
        >
          {/* Student photo (when enabled) OR the emblem bubble. */}
          {showPhoto ? (
            <StudentPhoto src={photoUrl} accent={effectiveAccent} gold={ornateGold} />
          ) : (
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
          )}

          {/* Header line — exam flanks it with laurels. */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isExam && <Laurel color={effectiveAccent} />}
            <Typography
              variant="h5"
              fontWeight={900}
              sx={{
                color: effectiveAccent,
                letterSpacing: 1.5,
                lineHeight: 1.1,
                fontFamily,
                fontSize: fz(
                  `calc(1.25rem * ${headingScale})`,
                  `calc(1.6rem * ${headingScale})`,
                ),
              }}
            >
              {heading}
            </Typography>
            {isExam && <Laurel color={effectiveAccent} flip />}
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ fontFamily }}>
            {intro || txt.awardedTo}
          </Typography>

          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              fontFamily,
              lineHeight: 1.05,
              color: nameColor,
              fontSize: fz(
                `calc(1.6rem * ${nameScale})`,
                `calc(3rem * ${nameScale})`,
              ),
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
            <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily }}>
              {txt.forText} {title}
            </Typography>
          )}

          {subtitle && (
            <Typography variant="body2" sx={{ color: accentDark, fontWeight: 600, fontFamily }}>
              {subtitle}
            </Typography>
          )}

          {body && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily, maxWidth: 600, whiteSpace: "pre-line", lineHeight: 1.5 }}
            >
              {body}
            </Typography>
          )}

          {congrats && (
            <Typography
              variant="subtitle1"
              sx={{ color: effectiveAccent, fontWeight: 800, fontFamily, mt: 0.2 }}
            >
              {congrats}
            </Typography>
          )}

          {thanks && (
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily, maxWidth: 560 }}>
              {thanks}
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
              <Typography variant="caption" sx={{ fontFamily, color: accentDark, fontWeight: 700, display: "block" }}>
                {txt.issuedOn}
              </Typography>
            )}
            {showDate && issued && (
              <Typography variant="caption" sx={{ fontFamily, color: "text.secondary" }}>
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
            <Typography variant="caption" sx={{ fontFamily, color: "text.secondary" }}>
              {signatureTitle}
            </Typography>
          </Box>
        </Stack>
      </Stack>
      ) : (
        <FitToBox enabled>{landscapeBody}</FitToBox>
      )}
    </Box>
  );
}
