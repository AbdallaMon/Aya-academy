"use client";

// Landscape certificate body — a header band on top, then two columns
// (content · credential), laid out at a fixed design canvas and auto-fitted by
// the caller so the type stays large. Landscape renders inside the auto-fitter
// at a fixed design width, so `fz` yields deterministic fixed sizes. Purely
// presentational; every value is threaded in from the CertificateCard orchestrator.

import { Box, Stack, Typography } from "@mui/material";
import { MdWorkspacePremium, MdSchool } from "react-icons/md";
import { ACADEMY_LOGO_SRC, BISMILLAH_TEXT } from "../../config/constant.js";
import { tint, shade, hideOnError } from "./helpers.js";
import { StudentPhoto, Laurel, Seal } from "./CertificateParts.jsx";
import { LANDSCAPE_DESIGN_W, LANDSCAPE_DESIGN_H } from "./FitToBox.jsx";

export default function LandscapeLayout({
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
}) {
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
  return (
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
}
