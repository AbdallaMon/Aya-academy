"use client";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// Resolve a "palette.path" string (e.g. "success.main") to a concrete color so
// we can tint the icon chip background with alpha().
function resolveColor(theme, color) {
  if (!color) return theme.palette.primary.main;
  if (color.startsWith("#") || color.startsWith("rgb")) return color;
  const [group, shade = "main"] = color.split(".");
  return theme.palette?.[group]?.[shade] ?? theme.palette.primary.main;
}

export default function StatCard({ label, value, icon, color = "primary.main" }) {
  const theme = useTheme();
  const c = resolveColor(theme, color);

  return (
    <Card
      sx={{
        height: "100%",
        overflow: "hidden",
        position: "relative",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: theme.shadows[6],
          borderColor: alpha(c, 0.4),
        },
        // Accent rail on the inline-start edge (RTL-safe).
        "&::before": {
          content: '""',
          position: "absolute",
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: `linear-gradient(180deg, ${c}, ${alpha(c, 0.4)})`,
        },
      }}
    >
      <CardContent sx={{ paddingInlineStart: 2.75 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ lineHeight: 1.1, color: "text.primary" }}
              noWrap
            >
              {value ?? 0}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
              noWrap
            >
              {label}
            </Typography>
          </Box>
          {icon && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 52,
                height: 52,
                borderRadius: 3,
                bgcolor: alpha(c, 0.14),
                color: c,
                flexShrink: 0,
                boxShadow: `inset 0 0 0 1px ${alpha(c, 0.18)}`,
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
