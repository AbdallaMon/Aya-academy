"use client";

import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

/**
 * AuthShell — centered card layout shared by the login & register screens.
 * Renders a brand header, a title/subtitle, the form (children) and a footer slot.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 90px)",
        display: "flex",
        alignItems: "center",
        py: { xs: 6, md: 8 },
        background: (theme) =>
          `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={4}
          sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
        >
          <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <Box
              component={Link}
              href="/"
              sx={{ display: "inline-flex" }}
              aria-label="Ayah Academy"
            >
              <Box
                component="img"
                src="/logos/logo.png"
                alt="Ayah Academy"
                sx={{ height: 64 }}
              />
            </Box>
            <Typography variant="h4" fontWeight={800} textAlign="center">
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {subtitle}
              </Typography>
            )}
          </Stack>

          {children}

          {footer && <Box sx={{ mt: 3, textAlign: "center" }}>{footer}</Box>}
        </Paper>
      </Container>
    </Box>
  );
}
