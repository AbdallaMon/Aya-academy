'use client';

import Link from 'next/link';
import { IconButton, Stack, Tooltip } from '@mui/material';
import { LanguageSwitch } from '@/shared/ui/buttons/LanguageSwitch.jsx';
import { pickNav } from '@/shared/data/navigation/navbar';
import { useTranslation } from '@/i18n/client.js';
import { useAuth } from '@/hooks/useAuth.js';
import { localePath } from '@/i18n/routing.js';
import NavbarCtaButton from './NavbarCtaButton';
import LoginIcon from './LoginIcon';

// Desktop-only actions on the inline-end: language, a login
// icon button (logged-out only, styled to match the theme toggle), and the
// primary CTA. Hidden below `md`, where the drawer takes over.
export default function NavbarActions() {
  const { lng } = useTranslation();
  const { isLoggedIn } = useAuth();
  const txt = pickNav(lng);

  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{ display: { xs: 'none', md: 'flex' }, flexShrink: 0 }}
    >
      <LanguageSwitch />
      {/* Login — icon only, matching the theme toggle's bordered-circle look.
          Tooltip + aria-label keep it discoverable. Logged-out only. */}
      {!isLoggedIn && (
        <Tooltip title={txt.login}>
          <IconButton
            component={Link}
            href={localePath(lng, '/login')}
            aria-label={txt.login}
            size="medium"
            sx={{
              color: 'primary.main',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              transition: 'all .2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <LoginIcon lng={lng} size={18} />
          </IconButton>
        </Tooltip>
      )}
      <NavbarCtaButton />
    </Stack>
  );
}
