'use client';

import Link from 'next/link';
import { Box, Container, Divider, Stack, Typography } from '@mui/material';
import { MdEmail, MdFavorite } from 'react-icons/md';
import { navSections, navHref } from '@/shared/data/navigation/navbar';
import { useTranslation } from '@/i18n/client.js';
import { useAuth } from '@/hooks/useAuth.js';
import { localePath } from '@/i18n/routing.js';
import { LanguageSwitch } from '@/shared/ui/buttons/LanguageSwitch.jsx';

const FOOTER_TEXT = {
  ar: {
    brand: 'أكاديمية آية',
    tagline: 'رحلة مرحة لتعلّم القرآن والأخلاق الجميلة للأطفال — بلُطف وأمان ومتعة.',
    explore: 'استكشف',
    account: 'حسابك',
    contact: 'تواصل معنا',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    dashboard: 'لوحتي',
    freeGame: 'العب لعبة مجانية',
    rights: 'جميع الحقوق محفوظة.',
    madeWith: 'صُنع بكل حب بواسطة',
    developerName: 'عبدالله عبدالصبور',
  },
  en: {
    brand: 'Ayah Academy',
    tagline: 'A joyful journey for kids to learn the Quran and beautiful manners — gentle, safe and fun.',
    explore: 'Explore',
    account: 'Account',
    contact: 'Contact',
    login: 'Login',
    signup: 'Sign up',
    dashboard: 'Dashboard',
    freeGame: 'Play a free game',
    rights: 'All rights reserved.',
    madeWith: 'Made with love by',
    developerName: 'Abdalla Abdelsabour',
  },
};

export default function SiteFooter() {
  const { lng } = useTranslation();
  const { isLoggedIn } = useAuth();
  const t = FOOTER_TEXT[lng === 'en' ? 'en' : 'ar'];
  const year = new Date().getFullYear();

  const linkSx = {
    color: 'text.secondary',
    textDecoration: 'none',
    fontSize: 14,
    transition: 'color .2s',
    '&:hover': { color: 'primary.main' },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: 2,
      borderRadius: 1,
    },
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        pt: { xs: 5, md: 7 },
        pb: 3,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gap: 4,
            gridTemplateColumns: { xs: '1fr', sm: '1.6fr 1fr 1fr', md: '2fr 1fr 1fr 1.2fr' },
          }}
        >
          {/* Brand */}
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <Box component="img" src="/logos/logo.png" alt={t.brand} sx={{ height: 52 }} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, lineHeight: 1.8 }}>
              {t.tagline}
            </Typography>
          </Box>

          {/* Explore */}
          <Box>
            <Typography fontWeight={800} sx={{ mb: 1.5 }}>
              {t.explore}
            </Typography>
            <Stack spacing={1}>
              {navSections.map((s) => (
                <Box key={s.id} component={Link} href={navHref(localePath, lng, s)} sx={linkSx}>
                  {s[lng] || s.ar}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Account */}
          <Box>
            <Typography fontWeight={800} sx={{ mb: 1.5 }}>
              {t.account}
            </Typography>
            <Stack spacing={1}>
              <Box component={Link} href={localePath(lng, '/free-game')} sx={linkSx}>
                {t.freeGame}
              </Box>
              {isLoggedIn ? (
                <Box component={Link} href={localePath(lng, '/dashboard')} sx={linkSx}>
                  {t.dashboard}
                </Box>
              ) : (
                <>
                  <Box component={Link} href={localePath(lng, '/login')} sx={linkSx}>
                    {t.login}
                  </Box>
                  <Box component={Link} href={localePath(lng, '/register')} sx={linkSx}>
                    {t.signup}
                  </Box>
                </>
              )}
            </Stack>
          </Box>

          {/* Contact + language */}
          <Box>
            <Typography fontWeight={800} sx={{ mb: 1.5 }}>
              {t.contact}
            </Typography>
            <Stack spacing={1.5}>
              <Box component="a" href="mailto:info@ayah.academy" sx={{ ...linkSx, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <MdEmail /> info@ayah.academy
              </Box>
              <LanguageSwitch size="sm" />
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary" textAlign="center">
          © {year} {t.brand}. {t.rights}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 0.75, display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%' }}
        >
          {t.madeWith}
          <Box component={MdFavorite} sx={{ color: 'error.main', fontSize: 16 }} aria-hidden />
          <Box
            component="a"
            href="https://abdallaabdelsabour.com/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: 'primary.main',
              fontWeight: 800,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              transition: 'color .2s',
              '&:hover': { color: 'primary.dark' },
            }}
          >
            {t.developerName}
          </Box>
        </Typography>
      </Container>
    </Box>
  );
}
