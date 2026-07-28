"use client";

import { Box, Stack, Typography, alpha } from "@mui/material";
import { MdLogin } from "react-icons/md";

export default function IdentityChoiceNotice({ txt }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2.5,
        bgcolor: (theme) => alpha(theme.palette.info.main, 0.07),
        border: 1,
        borderColor: (theme) => alpha(theme.palette.info.main, 0.22),
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box
          sx={{
            mt: 0.15,
            color: "info.main",
            display: "flex",
            flexShrink: 0,
          }}
        >
          <MdLogin size={21} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={800}>
            {txt.identityChoiceTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {txt.identityChoiceHint}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
