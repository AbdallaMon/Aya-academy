"use client";

// Portrait certificate body — the classic single-column layout. Rendered at the
// real container width (it has the vertical room), so it keeps the responsive
// {xs, md} font sizes via the `fz` helper. Purely presentational; every value is
// threaded in from the CertificateCard orchestrator.

import { Box, Stack, Typography } from "@mui/material";
import { MdWorkspacePremium, MdSchool } from "react-icons/md";
import { ACADEMY_LOGO_SRC, BISMILLAH_TEXT } from "../../config/constant.js";
import { tint, shade, hideOnError } from "./helpers.js";
import { StudentPhoto, Laurel, Seal } from "./CertificateParts.jsx";

export default function PortraitLayout({
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
  return (
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
  );
}
