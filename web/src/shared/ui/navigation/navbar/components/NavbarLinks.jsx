'use client';

import Link from 'next/link';
import { Box } from '@mui/material';
import { navbarSections, navHref } from '@/shared/data/navigation/navbar';
import { useTranslation } from '@/i18n/client.js';
import { localePath } from '@/i18n/routing.js';

// Centered desktop section links. Hidden below `md` — the drawer covers mobile.
export default function NavbarLinks() {
  const { lng } = useTranslation();

  return (
    <Box
      sx={{
        flex: 1,
        display: { xs: 'none', md: 'flex' },
        justifyContent: 'center',
        gap: 3,
      }}
    >
      {navbarSections.map((s) => (
        <Box
          key={s.id}
          component={Link}
          href={navHref(localePath, lng, s)}
          prefetch={s.id === 'blog' ? false : undefined}
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
            position: 'relative',
            transition: 'color .2s',
            '&:hover': { color: 'primary.main' },
          }}
        >
          {s[lng] || s.ar}
        </Box>
      ))}
    </Box>
  );
}
