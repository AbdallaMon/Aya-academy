"use client";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export default function SectionCard({ title, action, children, empty, emptyLabel }) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: 2,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 4,
                height: 20,
                borderRadius: 999,
                bgcolor: "primary.main",
                flexShrink: 0,
              }}
            />
            <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ color: "text.primary" }}>
              {title}
            </Typography>
          </Stack>
          {action}
        </Box>
        {empty ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 96,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {emptyLabel}
            </Typography>
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
