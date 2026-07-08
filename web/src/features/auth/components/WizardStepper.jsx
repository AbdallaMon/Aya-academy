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
      direction="row"
      spacing={{ xs: 1.5, sm: 2.5 }}
      justifyContent="center"
      sx={{ mb: 4 }}
    >
      {steps.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <Stack
            key={label}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ opacity: active || done ? 1 : 0.55 }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontWeight: 900,
                fontSize: 14,
                color: active || done ? "primary.contrastText" : "text.secondary",
                bgcolor: (th) =>
                  active || done ? "primary.main" : alpha(th.palette.text.primary, 0.08),
                boxShadow: (th) =>
                  active ? `0 0 0 5px ${alpha(th.palette.primary.main, 0.18)}` : "none",
                transition: "all .2s ease",
              }}
            >
              {done ? <MdCheck size={18} /> : i + 1}
            </Box>
            <Typography
              variant="body2"
              fontWeight={active ? 800 : 600}
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {label}
            </Typography>
            {i < steps.length - 1 && (
              <Box
                sx={{
                  width: { xs: 24, sm: 48 },
                  height: 3,
                  borderRadius: 2,
                  ml: { xs: 0.5, sm: 1 },
                  bgcolor: (th) =>
                    done ? "primary.main" : alpha(th.palette.text.primary, 0.12),
                }}
              />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
