'use client';

import { AppBar, Container, Toolbar } from '@mui/material';
import { alpha } from '@mui/material/styles';
import NavbarBrand from './components/NavbarBrand';
import NavbarLinks from './components/NavbarLinks';
import NavbarActions from './components/NavbarActions';
import NavbarDrawer from './components/NavbarDrawer';

// Public marketing top bar — layout only. Each region is its own component:
//   NavbarBrand    logo -> home
//   NavbarLinks    centered section links (desktop)
//   NavbarActions  language/theme toggles + CTA (desktop)
//   NavbarDrawer   hamburger + side drawer (mobile)
export default function SiteNavbar() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        // Frosted bar derived from the background token (was duplicated rgba
        // literals) so it tracks the brand surface in both themes.
        bgcolor: (theme) => alpha(theme.palette.background.default, 0.82),
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 76 }, gap: 2 }}>
          <NavbarBrand />
          <NavbarLinks />
          <NavbarActions />
          <NavbarDrawer />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
