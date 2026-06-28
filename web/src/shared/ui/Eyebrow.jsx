'use client';

// Eyebrow — the small uppercase teal kicker that sits above a section title.
// The exact recipe (teal brand text, 800 weight, wide tracking, 13px, uppercase)
// was hand-copied in Section, WhyAya and the child-dashboard preview; this is the
// single source so the brand accent stays consistent if it ever changes.

import { Typography } from '@mui/material';
import { brandTextColor } from '@/shared/ui/brandText.js';

export default function Eyebrow({ children, sx, component = 'p' }) {
  return (
    <Typography
      component={component}
      sx={{
        color: brandTextColor,
        fontWeight: 800,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        fontSize: 13,
        mb: 1.5,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}
