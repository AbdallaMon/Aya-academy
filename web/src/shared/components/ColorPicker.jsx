"use client";

// ColorPicker — a small controlled color input.
//
// Wraps a native <input type="color"> (the OS color wheel) with a MUI-styled
// shell plus a read-only hex label, so admins pick colors instead of typing
// hex codes. Controlled: pass { label, value, onChange }. `onChange` receives
// the new hex string (e.g. "#3D1F08").
//
// Used by the payment-template settings form and the per-invoice edit form.

import { Box, Stack, Typography } from "@mui/material";

function normalizeHex(value) {
  if (typeof value !== "string") return "#000000";
  const v = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#000000";
}

export default function ColorPicker({ label, value, onChange, disabled = false }) {
  const hex = normalizeHex(value);

  return (
    <Stack spacing={0.5}>
      {label ? (
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
          {label}
        </Typography>
      ) : null}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          px: 1,
          py: 0.75,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Box
          component="input"
          type="color"
          value={hex}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={label || "color"}
          sx={{
            width: 36,
            height: 36,
            p: 0,
            border: "none",
            borderRadius: 1,
            background: "none",
            cursor: disabled ? "default" : "pointer",
            "&::-webkit-color-swatch-wrapper": { p: 0 },
            "&::-webkit-color-swatch": { border: "1px solid rgba(0,0,0,0.15)", borderRadius: 4 },
            "&::-moz-color-swatch": { border: "1px solid rgba(0,0,0,0.15)", borderRadius: 4 },
          }}
        />
        <Typography
          sx={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}
        >
          {hex}
        </Typography>
      </Stack>
    </Stack>
  );
}
