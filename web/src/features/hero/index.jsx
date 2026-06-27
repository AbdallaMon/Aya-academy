'use client';

import Link from 'next/link';
import { Box, Button, Chip, Container, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { GiStarShuriken } from 'react-icons/gi';
import { MdSportsEsports } from 'react-icons/md';
import { useTranslation } from '@/i18n/client.js';
import { localePath } from '@/i18n/routing.js';

const HERO = {
  ar: {
    eyebrow: 'قرآن وأخلاق وألعاب للأطفال',
    title: 'رحلة مُحبّبة لتعلّم القرآن والأخلاق الجميلة',
    subtitle:
      'دروس ممتعة وآمنة للأطفال من ٥ إلى ١٤ سنة — تلاوة واضحة، معانٍ بسيطة، وألعاب تفاعلية تزرع الأخلاق وتجمع النجوم والأوسمة.',
    primary: 'ابدأ بحصة تجريبية مجانية',
    secondary: 'جرّب ألعابنا التفاعلية 🎮',
    freeTrial: 'بدون بطاقة دفع · بدون التزام · إلغاء في أي وقت',
    chips: ['معلّم خاص لطفلك', 'تلاوة واضحة', 'متابعة لولي الأمر'],
    imgAlt: 'أطفال يتعلّمون القرآن بسعادة',
  },
  en: {
    eyebrow: 'Quran, manners & games for kids',
    title: 'A loving journey to learn the Quran and beautiful manners',
    subtitle:
      'Fun, safe lessons for kids aged 5–14 — clear recitation, simple meanings, and interactive games that grow good character while collecting stars and badges.',
    primary: 'Start with a free trial session',
    secondary: 'Try our interactive games 🎮',
    freeTrial: 'No card · No commitment · Cancel anytime',
    chips: ['Your child’s own teacher', 'Clear recitation', 'Parent tracking'],
    imgAlt: 'Children happily learning the Quran',
  },
};

const MotionBox = motion.create(Box);

export default function Hero() {
  const theme = useTheme();
  const { lng } = useTranslation();
  const t = HERO[lng === 'en' ? 'en' : 'ar'];
  const isDark = theme.palette.mode === 'dark';

  // WebP variants (generated from the source PNGs): the full-bleed backgrounds
  // drop from ~2.2MB to ~30–60KB, the illustration ~200KB → ~115KB — a big
  // mobile LCP/data win since the bg is a CSS background under a scrim.
  const heroImg = isDark ? '/hero-dark.webp' : '/hero-light.webp';
  const heroDims = isDark ? { width: 1080, height: 848 } : { width: 1082, height: 848 };
  const bgImg = isDark ? '/hero-bg-dark.webp' : '/hero-bg-light.webp';

  return (
    <Box
      id="home"
      component="section"
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        minHeight: { xs: 'auto', md: '84vh' },
        pt: { xs: 5, md: 7 },
        pb: { xs: 7, md: 10 },
      }}
    >
      {/* Full-bleed themed background illustration (day / night) */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -2,
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Soft scrim so the copy stays readable over the artwork in both themes */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background: isDark
            ? `linear-gradient(180deg, ${alpha('#0B1524', 0.55)} 0%, ${alpha('#0B1524', 0.35)} 45%, ${alpha('#0B1524', 0.75)} 100%)`
            : `linear-gradient(180deg, ${alpha('#FFFFFF', 0.35)} 0%, ${alpha('#FFFFFF', 0.1)} 45%, ${alpha('#FFFFFF', 0.55)} 100%)`,
        }}
      />

      {/* playful floating icons (vertical only → RTL-safe) */}
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <MotionBox
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          sx={{ position: 'absolute', top: '14%', insetInlineStart: '5%', fontSize: 34, opacity: 0.85 }}
        >
          ⭐
        </MotionBox>
        <MotionBox
          animate={{ y: [0, 18, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          sx={{ position: 'absolute', top: '20%', insetInlineEnd: '7%', fontSize: 30, opacity: 0.85 }}
        >
          🌙
        </MotionBox>
        <MotionBox
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          sx={{ position: 'absolute', bottom: '12%', insetInlineStart: '11%', fontSize: 26, opacity: 0.75 }}
        >
          📖
        </MotionBox>
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: { xs: 4, md: 6 },
            alignItems: 'center',
          }}
        >
          {/* Copy */}
          <MotionBox
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Chip
              label={t.eyebrow}
              color="secondary"
              sx={{ fontWeight: 800, mb: 2.5, px: 0.5, color: 'secondary.contrastText' }}
            />
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: '2.1rem', sm: '2.7rem', md: '3.2rem' }, lineHeight: 1.15, mb: 2 }}
            >
              {t.title}
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                opacity: 0.92,
                lineHeight: 1.8,
                mb: 3,
                maxWidth: 560,
              }}
            >
              {t.subtitle}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
              >
                {t.secondary}
              </Button>
            </Stack>

            {/* Free-trial hook → drives registration before any subscription */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                mt: 2.5,
                px: 1.75,
                py: 1,
                borderRadius: 999,
                width: 'fit-content',
                maxWidth: '100%',
                bgcolor: (th) => alpha(th.palette.secondary.main, isDark ? 0.22 : 0.28),
                border: '1px solid',
                borderColor: (th) => alpha(th.palette.secondary.main, 0.5),
              }}
            >
              <Box component="span" sx={{ fontSize: 16, lineHeight: 1 }}>
                ✨
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {t.freeTrial}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', gap: 1, display: { xs: 'none', sm: 'flex' } }}>
              {t.chips.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  variant="outlined"
                  sx={{ fontWeight: 700, bgcolor: 'background.paper' }}
                />
              ))}
            </Stack>
          </MotionBox>

          {/* Illustration */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            sx={{ display: 'flex', justifyContent: 'center' }}
          >
            <Box
              component="img"
              src={heroImg}
              alt={t.imgAlt}
              // LCP image: load it eagerly with high priority, and reserve its
              // box (intrinsic width/height + aspect-ratio) so it never shifts
              // the layout as it decodes.
              width={heroDims.width}
              height={heroDims.height}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              sx={{
                width: '100%',
                maxWidth: 520,
                height: 'auto',
                aspectRatio: `${heroDims.width} / ${heroDims.height}`,
                filter: 'drop-shadow(0 24px 48px rgba(20,30,60,0.28))',
              }}
            />
          </MotionBox>
        </Box>
      </Container>
    </Box>
  );
}
