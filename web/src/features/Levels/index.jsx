'use client';

import { Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { SlBadge } from 'react-icons/sl';
import { MdStar } from 'react-icons/md';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';

const CONTENT = {
  ar: {
    eyebrow: 'المستويات',
    title: 'مستويات لكل طفل',
    subtitle: 'من أوّل الحروف إلى تلاوة واثقة.',
    description:
      'أكاديمية آية مرتّبة في مستويات واضحة حسب العمر والخبرة، ويتقدّم الأطفال بإيقاع ممتع لا يسبّب أي ضغط.',
    levels: [
      { title: 'مبتدئ', age: '٤–٦ سنوات', desc: 'الحروف والأصوات الأساسية وسور قصيرة بسيطة.', reward: 'وسام أول سورة' },
      { title: 'مستكشف', age: '٧–٩ سنوات', desc: 'سور قصيرة وأساسيات التجويد ومعانٍ سهلة.', reward: 'وسام المستكشف' },
      { title: 'بنّاء', age: '٩–١١ سنة', desc: 'سور أطول وتجويد أقوى وفهم للمعاني الرئيسية.', reward: 'وسام البنّاء' },
      { title: 'قارئ واثق', age: '١٢+ سنة', desc: 'تلاوة طليقة وفهم أعمق ولحظات تأمّل شخصية.', reward: 'وسام إتقان القرآن' },
    ],
  },
  en: {
    eyebrow: 'Levels',
    title: 'Levels for every child',
    subtitle: 'From first letters to confident recitation.',
    description:
      'Aya Academy is organized into clear levels by age and experience. Kids progress at a fun, pressure-free pace.',
    levels: [
      { title: 'Beginner', age: 'Ages 4–6', desc: 'Letters, basic sounds and simple short Surahs.', reward: 'First Surah badge' },
      { title: 'Explorer', age: 'Ages 7–9', desc: 'Short Surahs, tajweed basics and easy meanings.', reward: 'Explorer badge' },
      { title: 'Builder', age: 'Ages 9–11', desc: 'Longer Surahs, stronger tajweed, key themes.', reward: 'Builder badge' },
      { title: 'Confident reader', age: 'Ages 12+', desc: 'Fluent recitation, deeper understanding and reflection.', reward: 'Quran mastery badge' },
    ],
  },
};

const MotionBox = motion.create(Box);

export function Levels() {
  const theme = useTheme();
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];
  const accents = [
    theme.palette.secondary.main,
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  return (
    <Section id="levels">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '0.85fr 1.15fr' },
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
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
            {c.subtitle}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {c.description}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          {c.levels.map((level, i) => {
            const accent = accents[i % accents.length];
            return (
              <MotionBox
                key={level.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderTop: `4px solid ${accent}`,
                  boxShadow: `0 10px 26px ${alpha(accent, 0.1)}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: accent, bgcolor: alpha(accent, 0.12) }}>
                    <SlBadge size={22} />
                  </Box>
                  <Chip size="small" label={level.age} sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.1), color: accent }} />
                </Stack>
                <Typography variant="h6" fontWeight={800}>
                  {level.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5, lineHeight: 1.6, flex: 1 }}>
                  {level.desc}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: accent, fontWeight: 700 }}>
                  <MdStar />
                  <Typography variant="caption" fontWeight={800}>
                    {level.reward}
                  </Typography>
                </Stack>
              </MotionBox>
            );
          })}
        </Box>
      </Box>
    </Section>
  );
}

export default Levels;
