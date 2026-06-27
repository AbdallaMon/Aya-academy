'use client';

import { Stack } from '@mui/material';
import { LanguageSwitch } from '@/shared/ui/buttons/LanguageSwitch.jsx';
import { ThemeSwitch } from '@/shared/ui/buttons/ThemeSwitch';
import NavbarCtaButton from './NavbarCtaButton';

// Desktop-only actions on the inline-end: language + theme toggles and the CTA.
// Hidden below `md`, where the drawer takes over.
export default function NavbarActions() {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{ display: { xs: 'none', md: 'flex' }, flexShrink: 0 }}
    >
      <LanguageSwitch />
      <ThemeSwitch />
      <NavbarCtaButton />
    </Stack>
  );
}
