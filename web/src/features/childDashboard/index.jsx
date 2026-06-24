'use client';

import { Box, Chip, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { MdStar, MdCheckCircle } from 'react-icons/md';
import { GrAchievement } from 'react-icons/gr';
import { AiOutlineFire } from 'react-icons/ai';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';

const CONTENT = {
  ar: {
    eyebrow: 'لوحة الطفل',
    title: 'تابع كل خطوة في رحلتهم',
    features: [
      'تقدّم واضح لكل جزء ومستوى',
      'أوسمة محفّزة مثل «نجمة الجزء الأول»',
      'لوحة سهلة لولي الأمر بلغتين',
      'تذكيرات لطيفة بلا ضغط',
    ],
    card: {
      title: 'لوحة طفلك',
      sample: 'مثال',
      overall: 'التقدّم العام',
      keep: 'واصل التميّز! 🌟',
      completed: 'الأجزاء المكتملة',
      juz: ['الجزء ١', 'الجزء ٢'],
      badges: ['نجمة الجزء ١', 'بطل المواظبة'],
      streak: 'أيام متتالية',
      streakDesc: 'مواظبة رائعة! استمر 🔥',
    },
  },
  en: {
    eyebrow: "Child's dashboard",
    title: 'See every step of their journey',
    features: [
      "Clear progress for each Juz' and level",
      "Motivating badges like 'Juz 1 Star'",
      'A parent-friendly dashboard in both languages',
      'Gentle reminders, no pressure',
    ],
    card: {
      title: "Your child's dashboard",
      sample: 'Sample',
      overall: 'Overall progress',
      keep: 'Keep up the great work! 🌟',
      completed: 'Completed parts',
      juz: ['Juz 1', 'Juz 2'],
      badges: ['Juz 1 Star', 'Consistency Champ'],
      streak: 'days streak',
      streakDesc: 'Amazing consistency! Keep it up 🔥',
    },
  },
};

const MotionBox = motion.create(Box);
const completed = [100, 60];

export function ChildDashboardHome() {
  const theme = useTheme();
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];
  const card = c.card;

  return (
    <Section id="child-dashboard" alt>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 4, md: 6 },
          alignItems: 'center',
        }}
      >
        {/* Preview card */}
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          sx={{
            order: { xs: 2, md: 1 },
            p: { xs: 2.5, md: 3 },
            borderRadius: 5,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: `0 24px 50px ${alpha(theme.palette.primary.main, 0.14)}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontWeight={800}>{card.title}</Typography>
              <Chip
                label={card.sample}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: 11, fontWeight: 700, color: 'text.secondary' }}
              />
            </Stack>
            <Box sx={{ fontSize: 28 }}>🧒</Box>
          </Stack>

          {/* overall progress */}
          <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.08), mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography variant="body2" fontWeight={700}>
                {card.overall}
              </Typography>
              <Typography variant="h6" fontWeight={900} color="primary.main">
                35%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={35} sx={{ mt: 1, height: 10, borderRadius: 5 }} />
            <Typography variant="caption" color="text.secondary">
              {card.keep}
            </Typography>
          </Box>

          {/* completed parts */}
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            {card.completed}
          </Typography>
          <Stack spacing={1.25} sx={{ mb: 2 }}>
            {card.juz.map((name, i) => (
              <Box key={name}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" fontWeight={700}>
                    {name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {completed[i]}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={completed[i]}
                  color={completed[i] === 100 ? 'success' : 'primary'}
                  sx={{ height: 8, borderRadius: 5 }}
                />
              </Box>
            ))}
          </Stack>

          {/* badges + streak */}
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            <Chip icon={<MdStar />} label={card.badges[0]} color="secondary" sx={{ fontWeight: 700 }} />
            <Chip icon={<GrAchievement />} label={card.badges[1]} color="primary" sx={{ fontWeight: 700 }} />
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.12) }}
          >
            <Box sx={{ color: 'warning.main' }}>
              <AiOutlineFire size={30} />
            </Box>
            <Box>
              <Typography fontWeight={900}>5 {card.streak}</Typography>
              <Typography variant="caption" color="text.secondary">
                {card.streakDesc}
              </Typography>
            </Box>
          </Stack>
        </MotionBox>

        {/* Copy + features */}
        <Box sx={{ order: { xs: 1, md: 2 } }}>
          <Typography sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 13, mb: 1.5 }}>
            {c.eyebrow}
          </Typography>
          <Typography variant="h2" sx={{ mb: 3 }}>
            {c.title}
          </Typography>
          <Stack spacing={1.75}>
            {c.features.map((f) => (
              <Stack key={f} direction="row" spacing={1.25} alignItems="center">
                <Box sx={{ color: 'success.main', flexShrink: 0 }}>
                  <MdCheckCircle size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {f}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    </Section>
  );
}

export default ChildDashboardHome;
