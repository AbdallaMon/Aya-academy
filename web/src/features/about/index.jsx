'use client';

import { Box, Chip, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { TbWorld } from 'react-icons/tb';
import { FaChildren } from 'react-icons/fa6';
import { GoArrowUpRight } from 'react-icons/go';
import { MdCheckCircle, MdStar, MdAutoStories } from 'react-icons/md';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';

const FEATURE_ICONS = [TbWorld, FaChildren, GoArrowUpRight];

const CONTENT = {
  ar: {
    eyebrow: 'من نحن',
    title: 'عن أكاديمية آية',
    slogan: 'رحلة قرآنية دافئة ثنائية اللغة مصمّمة للأطفال ومدعومة من الأهل.',
    points: [
      'تساعد أكاديمية آية الأطفال على تعلّم تلاوة القرآن ومعانيه خطوة بخطوة بالعربية والإنجليزية.',
      'مصمّمة للأعمار ٥–١٤ بإيقاع لطيف وبنية واضحة وأوسمة محفّزة.',
      'يحصل الأهل على رؤية واضحة ومتابعة هادئة للتقدّم — بلا أي ضغط.',
    ],
    features: ['تعلّم ثنائي اللغة', 'مستويات مناسبة للأطفال', 'تقدّم وأوسمة'],
    visual: {
      child: 'آدم',
      level: 'المستوى ٣',
      progressLabel: 'تقدّم سورة الفاتحة',
      progressValue: '٥ من ٧ آيات',
      badge: 'وسام جديد!',
      streak: '٧ أيام متتالية',
      ayah: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      ayahMeaning: 'الحمد لله رب كل المخلوقات',
    },
  },
  en: {
    eyebrow: 'About us',
    title: 'About Aya Academy',
    slogan: 'A warm, bilingual Quran journey designed for kids and supported by parents.',
    points: [
      'Aya Academy helps children learn Quran recitation and meaning step-by-step in Arabic and English.',
      'Built for ages 5–14 with gentle pacing, clear structure and motivating badges.',
      'Parents get clear visibility and calm progress tracking — no pressure.',
    ],
    features: ['Bilingual learning', 'Kid-friendly levels', 'Progress & badges'],
    visual: {
      child: 'Adam',
      level: 'Level 3',
      progressLabel: 'Al-Fatihah progress',
      progressValue: '5 of 7 ayahs',
      badge: 'New badge!',
      streak: '7-day streak',
      ayah: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      ayahMeaning: 'All praise is for Allah, Lord of all worlds',
    },
  },
};

const MotionBox = motion.create(Box);

// A self-composed "progress preview" card — replaces the raster /about-1.png.
// It visualizes the exact value props in the copy (bilingual learning, kid
// levels, progress & badges) using theme tokens, so it stays crisp and on-brand
// in both light/dark and RTL.
function AboutVisual({ v }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <MotionBox
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      sx={{ position: 'relative', width: '100%', maxWidth: 460, mx: 'auto' }}
    >
      {/* soft glow blobs behind the card */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: -24,
          zIndex: 0,
          background: `radial-gradient(60% 60% at 70% 20%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 70%), radial-gradient(50% 50% at 20% 90%, ${alpha(theme.palette.secondary.main, 0.22)}, transparent 70%)`,
          filter: 'blur(8px)',
        }}
      />

      {/* main progress card */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: `0 24px 50px ${alpha(theme.palette.primary.main, isDark ? 0.35 : 0.16)}`,
        }}
      >
        {/* child header */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              fontSize: 26,
              color: '#fff',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              flexShrink: 0,
            }}
          >
            🧒
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>
              {v.child}
            </Typography>
            <Chip
              size="small"
              color="primary"
              icon={<MdStar size={15} />}
              label={v.level}
              sx={{ mt: 0.5, fontWeight: 700, height: 24 }}
            />
          </Box>
        </Stack>

        {/* progress */}
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ color: 'primary.main', display: 'flex' }}>
              <MdAutoStories size={18} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{v.progressLabel}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {v.progressValue}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={71}
          sx={{
            height: 10,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
            },
          }}
        />

        {/* star streak */}
        <Stack direction="row" spacing={0.5} sx={{ mt: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              component={MdStar}
              sx={{ color: i < 4 ? 'secondary.main' : alpha(theme.palette.text.primary, 0.15), fontSize: 22 }}
            />
          ))}
        </Stack>

        {/* bilingual ayah snippet */}
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.07),
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.18),
          }}
        >
          <Typography
            sx={{ fontWeight: 700, fontSize: 19, textAlign: 'center', direction: 'rtl', lineHeight: 1.9 }}
          >
            {v.ayah}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
          >
            {v.ayahMeaning}
          </Typography>
        </Box>
      </Box>

      {/* floating badge — top */}
      <MotionBox
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: -16,
          insetInlineEnd: -10,
          zIndex: 2,
          px: 1.5,
          py: 0.75,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: `0 10px 24px ${alpha(theme.palette.secondary.main, 0.3)}`,
        }}
      >
        <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>🏅</Box>
        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{v.badge}</Typography>
      </MotionBox>

      {/* floating badge — bottom */}
      <MotionBox
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          bottom: -14,
          insetInlineStart: -10,
          zIndex: 2,
          px: 1.5,
          py: 0.75,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>🔥</Box>
        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{v.streak}</Typography>
      </MotionBox>
    </MotionBox>
  );
}

export function About() {
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];

  return (
    <Section id="about">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 4, md: 6 },
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 13, mb: 1.5 }}>
            {c.eyebrow}
          </Typography>
          <Typography variant="h2" sx={{ mb: 1.5 }}>
            {c.title}
          </Typography>
          <Typography variant="h5" color="primary.main" fontWeight={700} sx={{ mb: 2.5 }}>
            {c.slogan}
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {c.points.map((p) => (
              <Stack key={p} direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ color: 'success.main', mt: '2px', flexShrink: 0 }}>
                  <MdCheckCircle size={22} />
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {p}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1.25}>
            {c.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i];
              return <Chip key={f} icon={<Icon />} label={f} sx={{ fontWeight: 700, py: 2, px: 0.5 }} variant="outlined" />;
            })}
          </Stack>
        </Box>

        <AboutVisual v={c.visual} />
      </Box>
    </Section>
  );
}

export default About;
