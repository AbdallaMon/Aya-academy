'use client';

import Link from 'next/link';
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { GiStarShuriken } from 'react-icons/gi';
import { MdSportsEsports } from 'react-icons/md';
import { useTranslation } from '@/i18n/client.js';
import { localePath } from '@/i18n/routing.js';

const HERO = {
  ar: {
    eyebrow: 'قرآن · لغة عربية · دراسات إسلامية · أخلاق · ألعاب',
    title: 'رحلة مُحبّبة لتعلّم القرآن والأخلاق الجميلة',
    subtitle:
      'دروس ممتعة وآمنة للطلاب من ٥ سنوات فأكثر — تلاوة واضحة، معانٍ بسيطة، وألعاب تفاعلية تزرع الأخلاق وتجمع النجوم والأوسمة.',
    primary: 'احجز حصة مجانية',
    secondary: 'جرّب ألعابنا التفاعلية 🎮',
    freeTrial: 'بدون بطاقة دفع · بدون التزام · إلغاء في أي وقت',
    chips: ['معلّم خاص للطالب', 'تلاوة واضحة', 'متابعة لولي الأمر'],
    imgAlt: 'طلاب يتعلّمون القرآن بسعادة',
  },
  en: {
    eyebrow: 'Quran · Arabic · Islamic studies · Manners · Games',
    title: 'Learn Quran online with qualified teachers',
    subtitle:
      'Fun, safe lessons for students aged 5 and up — clear recitation, simple meanings, and interactive games that grow good character while collecting stars and badges.',
    primary: 'Book a free session',
    secondary: 'Try our interactive games 🎮',
    freeTrial: 'No card · No commitment · Cancel anytime',
    chips: ['The student’s own teacher', 'Clear recitation', 'Parent tracking'],
    imgAlt: 'Students happily learning the Quran',
  },
};

const MotionBox = motion.create(Box);

export default function Hero() {
  const { lng } = useTranslation();
  const t = HERO[lng === 'en' ? 'en' : 'ar'];

  // Ayah uses one stable light/green theme, so the hero no longer hydrates just
  // to choose between light and dark assets.
  const heroImg = '/hero-light.webp';
  const heroDims = { width: 1082, height: 848 };
  const bgImg = '/hero-bg-light.webp';

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
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.55) 100%)',
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
          <Box>
            <Chip
              label={t.eyebrow}
              sx={{
                fontWeight: 800,
                mb: 2.5,
                // Solid amber fill + dark slate text (secondary.contrastText #25313F
                // on #F6C453 ≈ 8:1) so the kicker reads clearly in BOTH themes — the
                // old translucent `color="secondary"` fill (amber @20%) went
                // near-invisible over the dark-navy hero background. `height: auto`
                // + wrapping lets the (now longer) subject list flow onto a second
                // line on small screens instead of truncating.
                height: 'auto',
                py: 0.75,
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                '& .MuiChip-label': {
                  px: 1.5,
                  whiteSpace: 'normal',
                  lineHeight: 1.6,
                  textAlign: 'center',
                },
              }}
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
                bgcolor: 'rgba(246, 196, 83, 0.28)',
                border: '1px solid',
                borderColor: 'rgba(246, 196, 83, 0.5)',
              }}
            >
              <Box component="span" sx={{ fontSize: 16, lineHeight: 1 }}>
                ✨
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {t.freeTrial}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', gap: 1, display: 'flex' }}>
              {t.chips.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  variant="outlined"
                  sx={{ fontWeight: 700, bgcolor: 'background.paper' }}
                />
              ))}
            </Stack>
          </Box>

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
