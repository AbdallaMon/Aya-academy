'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  Stack,
} from '@mui/material';
import { IoMdClose, IoMdMenu } from 'react-icons/io';
import { navSections, navHref, pickNav } from '@/shared/data/navigation/navbar';
import { useTranslation } from '@/i18n/client.js';
import { localePath } from '@/i18n/routing.js';
import { ThemeSwitch } from '@/shared/ui/buttons/ThemeSwitch';
import { LanguageSwitch } from '@/shared/ui/buttons/LanguageSwitch.jsx';
import NavbarBrand from './NavbarBrand';
import NavbarCtaButton from './NavbarCtaButton';

// Mobile navigation: a hamburger that opens a side Drawer (anchored to the
// inline-start edge per language). Visible only below `md`.
export default function NavbarDrawer() {
  const [open, setOpen] = useState(false);
  const { lng } = useTranslation();
  const txt = pickNav(lng);
  const close = () => setOpen(false);

  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        marginInlineStart: 'auto',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      {/* Persistent conversion CTA — stays visible as the parent scrolls the long
          funnel, instead of being buried inside the drawer. Compact padding so the
          brand + CTA + toggle + hamburger all fit a 360–390px bar. */}
      <NavbarCtaButton size="small" sx={{ px: 1.5, fontSize: 13 }} />
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
          {/* Header: brand + close */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <NavbarBrand height={52} onClick={close} />
            <IconButton onClick={close} color="primary" size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
              <IoMdClose size={18} />
            </IconButton>
          </Box>

          {/* Section links */}
          <List>
            {navSections.map((s) => (
              <ListItemButton
                key={s.id}
                component={Link}
                href={navHref(localePath, lng, s)}
                onClick={close}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {s[lng] || s.ar}
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* CTA + language */}
          <Stack spacing={1.5}>
            <NavbarCtaButton onClick={close} />
            <Box sx={{ pt: 1 }}>
              <LanguageSwitch size="sm" />
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}
