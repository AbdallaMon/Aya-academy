'use client';

import Link from 'next/link';
import { AppBar, Box, Button, Container, Stack, Toolbar } from '@mui/material';
import { navSections, pickNav } from '@/shared/data/navigation/navbar';
import { useTranslation } from '@/i18n/client.js';
import { useAuth } from '@/hooks/useAuth.js';
import { localePath } from '@/i18n/routing.js';
import { ThemeSwitch } from '@/shared/ui/buttons/ThemeSwitch';
import { LanguageSwitch } from '@/shared/ui/buttons/LanguageSwitch.jsx';
import NavbarDrawer from './components/NavbarDrawer';

export default function SiteNavbar() {
  const { lng } = useTranslation();
  const { isLoggedIn } = useAuth();
  const txt = pickNav(lng);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        bgcolor: (theme) =>
          theme.palette.mode === 'light'
            ? 'rgba(255,255,255,0.82)'
            : 'rgba(11,21,36,0.82)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 76 }, gap: 2 }}>
          {/* Brand */}
          <Box
            component={Link}
            href={localePath(lng, '/')}
            sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
            aria-label={txt.brand}
          >
            <Box component="img" src="/logos/logo.png" alt={txt.brand} sx={{ height: { xs: 48, md: 60 } }} />
          </Box>

          {/* Desktop section links */}
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              gap: 3,
            }}
          >
            {navSections.map((s) => (
              <Box
                key={s.id}
                component={Link}
                href={localePath(lng, `/#${s.id}`)}
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

          {/* Desktop actions */}
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ display: { xs: 'none', md: 'flex' }, flexShrink: 0 }}
          >
            <LanguageSwitch />
            <ThemeSwitch />
            {isLoggedIn ? (
              <Button variant="contained" component={Link} href={localePath(lng, '/dashboard')}>
                {txt.dashboard}
              </Button>
            ) : (
              <Button variant="contained" component={Link} href={localePath(lng, '/register')}>
                {txt.signup}
              </Button>
            )}
          </Stack>

          {/* Mobile */}
          <NavbarDrawer />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
