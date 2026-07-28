'use client';

import Link from 'next/link';
import Image from 'next/image';
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
        <Image
          src="/logos/logo.png"
          alt={txt.brand}
          width={100}
          height={60}
          sizes="100px"
          style={{ width: 'auto', height: '100%' }}
        />
      </Box>
    </Box>
  );
}
