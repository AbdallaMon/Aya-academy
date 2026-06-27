'use client';

import Link from 'next/link';
import { Box } from '@mui/material';
import { pickNav } from '@/shared/data/navigation/navbar';
import { useTranslation } from '@/i18n/client.js';
import { localePath } from '@/i18n/routing.js';

// Logo that links to the localized homepage. `height` accepts a number or an
// MUI responsive object so the bar and the drawer can size it differently.
export default function NavbarBrand({ height = { xs: 48, md: 60 }, onClick }) {
  const { lng } = useTranslation();
  const txt = pickNav(lng);

  return (
    <Box
      component={Link}
      href={localePath(lng, '/')}
      onClick={onClick}
      aria-label={txt.brand}
      sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
    >
      <Box component="img" src="/logos/logo.png" alt={txt.brand} sx={{ height }} />
    </Box>
  );
}
