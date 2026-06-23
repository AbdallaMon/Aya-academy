"use client";

import { Box, Stack, Typography } from "@mui/material";

/**
 * Visual representation of a badge definition using its bgColor / textColor /
 * emoji. Used in the badges grid (detail page), the award dialog and the
 * admin preview cell.
 */
export default function BadgeChip({ badge, lng = "ar", size = "md" }) {
  if (!badge) return null;
  const name = lng === "en" ? badge.nameEn || badge.nameAr : badge.nameAr || badge.nameEn;
  const bg = badge.bgColor || "#EEF2FF";
  const fg = badge.textColor || "#1E293B";
  const small = size === "sm";

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        bgcolor: bg,
        color: fg,
        borderRadius: 999,
        px: small ? 1 : 1.5,
        py: small ? 0.25 : 0.5,
        maxWidth: "100%",
      }}
    >
      <Box component="span" sx={{ fontSize: small ? 16 : 20, lineHeight: 1 }}>
        {badge.emoji || "🏅"}
      </Box>
      <Typography
        variant={small ? "caption" : "body2"}
        fontWeight={800}
        noWrap
        sx={{ color: "inherit" }}
      >
        {name}
      </Typography>
    </Stack>
  );
}
