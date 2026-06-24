'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  Stack,
} from '@mui/material';
import { IoMdClose, IoMdMenu } from 'react-icons/io';
import { navSections, pickNav } from '@/shared/data/navigation/navbar';
import { useTranslation } from '@/i18n/client.js';
import { useAuth } from '@/hooks/useAuth.js';
import { localePath } from '@/i18n/routing.js';
import { ThemeSwitch } from '@/shared/ui/buttons/ThemeSwitch';
import { LanguageSwitch } from '@/shared/ui/buttons/LanguageSwitch.jsx';

export default function NavbarDrawer() {
  const [open, setOpen] = useState(false);
  const { lng } = useTranslation();
  const { isLoggedIn } = useAuth();
  const txt = pickNav(lng);
  const close = () => setOpen(false);

  return (
    <Box sx={{ display: { xs: 'flex', md: 'none' }, marginInlineStart: 'auto', alignItems: 'center', gap: 0.5 }}>
      <ThemeSwitch />
      <IconButton onClick={() => setOpen(true)} size="medium" aria-label={txt.menu} color="inherit">
        <IoMdMenu />
      </IconButton>
      <Drawer
        open={open}
        onClose={close}
        anchor={lng === 'ar' ? 'right' : 'left'}
        PaperProps={{ sx: { width: 300 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box component="img" src="/logos/logo.png" alt={txt.brand} sx={{ height: 52 }} />
            <IconButton onClick={close} color="primary" size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
              <IoMdClose size={18} />
            </IconButton>
          </Box>

          <List>
            {navSections.map((s) => (
              <ListItemButton
                key={s.id}
                component={Link}
                href={localePath(lng, `/#${s.id}`)}
                onClick={close}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {s[lng] || s.ar}
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.5}>
            {isLoggedIn ? (
              <Button variant="contained" component={Link} href={localePath(lng, '/dashboard')} onClick={close}>
                {txt.dashboard}
              </Button>
            ) : (
              <Button variant="contained" component={Link} href={localePath(lng, '/register')} onClick={close}>
                {txt.signup}
              </Button>
            )}
            <Box sx={{ pt: 1 }}>
              <LanguageSwitch size="sm" />
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
