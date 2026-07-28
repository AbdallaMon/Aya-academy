import Image from 'next/image';
import { Box, Chip, Container, Stack, Typography } from '@mui/material';
import { localePath } from '@/i18n/routing.js';
import HeroActions from '../components/HeroActions.jsx';

const HERO = {
  ar: {
    eyebrow: 'قرآن · لغة عربية · دراسات إسلامية · أخلاق · ألعاب',
    title: 'رحلة مُحبّبة لتعلّم القرآن والأخلاق الجميلة',
    subtitle:
      'في أكاديمية آية، نقدّم دروسًا ممتعة وآمنة للطلاب من ٥ سنوات فأكثر — تلاوة واضحة، معانٍ بسيطة، وألعاب تفاعلية تزرع الأخلاق وتجمع النجوم والأوسمة.',
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
      'At Ayah Academy, students aged 5 and up learn through fun, safe lessons — clear recitation, simple meanings, and interactive games that grow good character.',
    primary: 'Book a free session',
    secondary: 'Try our interactive games 🎮',
    freeTrial: 'No card · No commitment · Cancel anytime',
    chips: ['The student’s own teacher', 'Clear recitation', 'Parent tracking'],
    imgAlt: 'Students happily learning the Quran',
  },
};

export default function Hero({ lng = 'en' }) {
  const t = HERO[lng === 'en' ? 'en' : 'ar'];

  // Ayah uses one stable light/green theme, so the hero no longer hydrates just
  // to choose between light and dark assets.
  const heroImg = '/hero-light.webp';
  const heroDims = { width: 1040, height: 815 };
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
        <Box
          sx={{ position: 'absolute', top: '14%', insetInlineStart: '5%', fontSize: 34, opacity: 0.85 }}
        >
          ⭐
        </Box>
        <Box
          sx={{ position: 'absolute', top: '20%', insetInlineEnd: '7%', fontSize: 30, opacity: 0.85 }}
        >
          🌙
        </Box>
        <Box
          sx={{ position: 'absolute', bottom: '12%', insetInlineStart: '11%', fontSize: 26, opacity: 0.75 }}
        >
          📖
        </Box>
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

            <HeroActions
              primaryHref={localePath(lng, '/register')}
              primaryLabel={t.primary}
              secondaryHref={localePath(lng, '/free-game')}
              secondaryLabel={t.secondary}
            />

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
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Image
              src={heroImg}
              alt={t.imgAlt}
              width={heroDims.width}
              height={heroDims.height}
              preload
              sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 900px) calc(100vw - 48px), 520px"
              style={{
                width: '100%',
                maxWidth: 520,
                height: 'auto',
                aspectRatio: `${heroDims.width} / ${heroDims.height}`,
                filter: 'drop-shadow(0 24px 48px rgba(20,30,60,0.28))',
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
