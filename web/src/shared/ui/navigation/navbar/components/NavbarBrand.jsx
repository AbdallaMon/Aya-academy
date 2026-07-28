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
      <Box sx={{ height, lineHeight: 0 }}>
        <Box
          component="img"
          src="/logos/logo-120.png"
          srcSet="/logos/logo-120.png 1x, /logos/logo-240.png 2x"
          alt={txt.brand}
          width={100}
          height={60}
          loading="eager"
          decoding="async"
          sx={{ display: 'block', width: 'auto', height: '100%' }}
        />
      </Box>
    </Box>
  );
}
