"use client";

import { alpha, Box, CircularProgress, Typography } from "@mui/material";

// Centered spinner overlaying its positioned parent (type="box") or the whole
// viewport (type="overlay"). Renders nothing when not loading.
export default function LoadingOverlay({ message, isLoading, type = "box" }) {
  if (!isLoading) return null;
  return (
    <Box
      sx={{
        position: type === "box" ? "absolute" : "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: (theme) => alpha(theme.palette.background.default, 0.8),
        zIndex: (theme) => theme.zIndex.modal - 1,
        gap: 1.5,
        height: type === "box" ? "100%" : "100vh",
        width: type === "box" ? "100%" : "100vw",
      }}
    >
      <CircularProgress color="primary" size={36} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}
