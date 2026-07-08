"use client";

// Small shared certificate parts: the circular student photo, the EXAM-style
// laurel, and the official seal stamp. All purely presentational.

import { Box } from "@mui/material";
import { MdPerson } from "react-icons/md";
import { tint, hideOnError } from "./helpers.js";

// Circular student photo (or a neutral placeholder when none / on error).
export function StudentPhoto({ src, accent, gold }) {
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

// Decorative laurel for the unified EXAM style (mirrored on each side).
export function Laurel({ color, flip = false }) {
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
export function Seal({ color, label }) {
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
