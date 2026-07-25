// Shared "playful gradient hero" surface — used by BOTH the real student
// dashboard hero (StudentOverview) and the marketing dashboard preview
// (childDashboard) so the two never drift. White text sits on the colored
// gradient in both light/dark themes on purpose (the fill is the same teal→green
// regardless of page background), so the foregrounds are intentionally literal.

import { Box, Typography } from '@mui/material';

// The teal → green hero gradient. Centralized so a change updates every hero.
export function heroGradient(theme) {
  return `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`;
}

// A single stat (points / level / rank) shown on a hero. `filled` adds the
// translucent pill background (used on the real dashboard); the marketing
// preview uses the unfilled, slightly smaller variant.
export function HeroStatPill({ value, label, filled = true, minWidth = 72 }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        minWidth,
        ...(filled && {
          px: 1.5,
          py: 1,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.16)',
        }),
      }}
    >
      <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.92 }}>
        {label}
      </Typography>
    </Box>
  );
}
