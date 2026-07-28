"use client";

import { Box, Stack, Typography, alpha } from "@mui/material";
import { MdCheck } from "react-icons/md";

/**
 * WizardStepper — the modern segmented progress indicator for RegisterWizard.
 * Pure presentational extraction: renders the `steps` labels against the
 * current `step` index.
 */
export default function WizardStepper({ steps, step }) {
  return (
    <Stack
      direction={{ xs: "row", md: "column" }}
      spacing={{ xs: 1, md: 1.25 }}
      sx={{ width: "100%" }}
    >
      {steps.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <Stack
            key={label}
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{
              minWidth: 0,
              flex: { xs: 1, md: "initial" },
              px: { xs: 1, sm: 1.25, md: 1.5 },
              py: { xs: 1, md: 1.25 },
              borderRadius: 2.5,
              border: 1,
              borderColor: (theme) =>
                active
                  ? alpha(theme.palette.primary.main, 0.34)
                  : "transparent",
              bgcolor: (theme) =>
                active
                  ? alpha(theme.palette.primary.main, 0.09)
                  : "transparent",
              opacity: active || done ? 1 : 0.58,
              transition: "all .2s ease",
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontWeight: 900,
                fontSize: 14,
                color: active || done ? "primary.contrastText" : "text.secondary",
                bgcolor: (th) =>
                  active || done ? "primary.main" : alpha(th.palette.text.primary, 0.08),
              }}
            >
              {done ? <MdCheck size={18} /> : i + 1}
            </Box>
            <Typography
              variant="caption"
              fontWeight={active ? 800 : 600}
              sx={{
                display: { xs: "none", sm: "block" },
                lineHeight: 1.35,
                color: active ? "text.primary" : "text.secondary",
              }}
            >
              {label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
