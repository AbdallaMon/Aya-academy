'use client';

import Link from 'next/link';
import { Button } from '@mui/material';
import { pickNav } from '@/shared/data/navigation/navbar';
import { useTranslation } from '@/i18n/client.js';
import { useAuth } from '@/hooks/useAuth.js';
import { localePath } from '@/i18n/routing.js';

// Primary call-to-action: "Dashboard" when logged in, otherwise the free-trial
// hook ("Book a free session"). Shared by the desktop actions and the mobile
// drawer/bar so the auth logic lives in one place.
export default function NavbarCtaButton({ onClick, fullWidth = false, size = 'medium', sx }) {
  const { lng } = useTranslation();
  const { isLoggedIn } = useAuth();
  const txt = pickNav(lng);

  const { href, label } = isLoggedIn
    ? { href: '/dashboard', label: txt.dashboard }
    : { href: '/register', label: txt.ctaFree };

  return (
    <Button
      variant="contained"
      size={size}
      component={Link}
      href={localePath(lng, href)}
      onClick={onClick}
      fullWidth={fullWidth}
      sx={{ whiteSpace: 'nowrap', ...sx }}
    >
      {label}
    </Button>
  );
}
