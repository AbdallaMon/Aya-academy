'use client';

// FreeSessionPromo — a bold promo banner that drives registration BEFORE any
// paid subscription: "Sign up now and get a free trial session". Sits right
// above the pricing section in the homepage funnel. Edit the text in PROMO.

import Link from 'next/link';
import { Box, Button, Container, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { GiStarShuriken } from 'react-icons/gi';
import { MdSportsEsports } from 'react-icons/md';
import { useTranslation } from '@/i18n/client.js';
import { localePath } from '@/i18n/routing.js';

const PROMO = {
  ar: {
    badge: '🎁 عرض خاص',
    title: 'سجّل الآن واحصل على حصة تجريبية مجانية',
    subtitle:
      'جرّب أكاديمية آية قبل أي اشتراك — حصة كاملة مع معلّم، بدون بطاقة دفع وبدون التزام.',
    primary: 'سجّل الآن مجانًا',
    secondary: 'جرّب لعبة مجانية 🎮',
    note: 'بدون بطاقة دفع · إلغاء في أي وقت',
  },
  en: {
    badge: '🎁 Special offer',
    title: 'Sign up now and get a free trial session',
    subtitle:
      'Try Aya Academy before any subscription — a full session with a teacher, no card and no commitment.',
    primary: 'Sign up free',
    secondary: 'Try a free game 🎮',
    note: 'No card required · Cancel anytime',
  },
};

export default function FreeSessionPromo() {
  const theme = useTheme();
  const { lng } = useTranslation();
  const t = PROMO[lng === 'en' ? 'en' : 'ar'];
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box id="free-trial" sx={{ py: { xs: 5, md: 7 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 5,
            px: { xs: 3, md: 6 },
            py: { xs: 4, md: 6 },
            textAlign: 'center',
            border: '1px solid',
            borderColor: (th) => alpha(th.palette.primary.main, 0.35),
            background: (th) =>
              `radial-gradient(700px 320px at 0% 0%, ${alpha(th.palette.secondary.main, isDark ? 0.28 : 0.35)} 0%, transparent 60%),` +
              `radial-gradient(700px 320px at 100% 100%, ${alpha(th.palette.primary.main, isDark ? 0.3 : 0.22)} 0%, transparent 60%),` +
              th.palette.background.paper,
            boxShadow: (th) => `0 24px 60px ${alpha(th.palette.primary.main, 0.18)}`,
          }}
        >
          <Typography
            component="span"
            sx={{
              display: 'inline-block',
              mb: 2,
              px: 1.75,
              py: 0.75,
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 14,
              bgcolor: (th) => alpha(th.palette.secondary.main, 0.35),
              color: 'text.primary',
            }}
          >
            {t.badge}
          </Typography>

          <Typography
            variant="h2"
            sx={{ fontSize: { xs: '1.7rem', md: '2.3rem' }, lineHeight: 1.25, mb: 1.5 }}
          >
            {t.title}
          </Typography>

          <Typography
            variant="h6"
            sx={{ fontWeight: 400, color: 'text.secondary', maxWidth: 640, mx: 'auto', mb: 3.5 }}
          >
            {t.subtitle}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
          >
            <Button
              component={Link}
              href={localePath(lng, '/register')}
              variant="contained"
              size="large"
              startIcon={<GiStarShuriken />}
            >
              {t.primary}
            </Button>
            <Button
              component={Link}
              href={localePath(lng, '/free-game')}
              variant="outlinedYellow"
              size="large"
              startIcon={<MdSportsEsports />}
              sx={{ backgroundColor: 'background.paper' }}
            >
              {t.secondary}
            </Button>
          </Stack>

          <Typography variant="body2" sx={{ mt: 2.5, color: 'text.secondary', fontWeight: 600 }}>
            {t.note}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
