"use client";

import { Box, Stack, Typography } from "@mui/material";

// Section heading: a colored pill + emoji + title. Bigger & friendlier than the
// admin SectionCard header so it reads well for a child.
export default function SectionTitle({ emoji, title, action }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={1}
      sx={{ mb: 1.5, mt: 1 }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
        <Box aria-hidden sx={{ fontSize: 24 }}>{emoji}</Box>
        <Typography variant="h6" fontWeight={900} noWrap sx={{ color: "text.primary" }}>
          {title}
        </Typography>
      </Stack>
      {action}
    </Stack>
  );
}
