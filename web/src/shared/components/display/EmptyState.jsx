"use client";

import { Box, Button, Typography } from "@mui/material";

// Generic empty/error placeholder for tables, lists and panels.
export default function EmptyState({ title, body, actionLabel, onAction, icon }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 6,
        px: 2,
        textAlign: "center",
      }}
    >
      {icon}
      {title && (
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      )}
      {body && (
        <Typography variant="body2" color="text.secondary">
          {body}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="outlined" size="small" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
