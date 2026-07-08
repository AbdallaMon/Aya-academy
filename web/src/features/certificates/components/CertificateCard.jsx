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

import { Box } from "@mui/material";
import { useTranslation } from "../../../i18n/client.js";
import { buildFileUrl } from "../../../shared/lib/fileUrl.js";
import { useCertificatesText } from "../config/certificatesText.js";
import {
  ACADEMY_LOGO_SRC,
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
import {
  clampNum,
  hideOnError,
  parseTheme,
  tint,
  shade,
  buildSurface,
  buildFrame,
} from "./certificateCard/helpers.js";
import Decoration from "./certificateCard/Decorations.jsx";
import OrnateFrame from "./certificateCard/OrnateFrame.jsx";
import FitToBox from "./certificateCard/FitToBox.jsx";
import PortraitLayout from "./certificateCard/PortraitLayout.jsx";
import LandscapeLayout from "./certificateCard/LandscapeLayout.jsx";

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
    // Optional per-certificate title override (e.g. an admin-entered title on a
    // manually issued, template-based certificate). Rendered as the "For …" line.
    title = (en ? certificate.titleEn : certificate.titleAr) || "";
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

  // Everything the portrait / landscape body needs — computed once, threaded down.
  const layoutProps = {
    fontFamily,
    accentDark,
    fz,
    txt,
    lng,
    logoPx,
    secondary,
    contentSpacing,
    effectiveAccent,
    ornateGold,
    nameColor,
    headingScale,
    nameScale,
    emoji,
    isExam,
    showBismillah,
    showTagline,
    showPhoto,
    photoUrl,
    showDate,
    showSeal,
    heading,
    intro,
    studentName,
    title,
    subtitle,
    body,
    congrats,
    thanks,
    issued,
    sealLabel,
    signature,
    signatureTitle,
  };

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

      {/* Body — portrait keeps its classic single column; landscape uses the
          two-column landscape body, auto-fitted so the type stays large. */}
      {isPortrait ? (
        <PortraitLayout {...layoutProps} />
      ) : (
        <FitToBox enabled>
          <LandscapeLayout {...layoutProps} />
        </FitToBox>
      )}
    </Box>
  );
}
