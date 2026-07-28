"use client";

// The ornate (Islamic) frame: layered borders + a subtle geometric pattern band
// + arabesque corner motifs. Painted absolutely behind the certificate content.

import { Box } from "@mui/material";

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
export default function OrnateFrame({ accent, gold }) {
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
