'use client';

// Teachers — a trust block that answers the parent's biggest unspoken question:
// "who will actually teach my child the Quran?". Content is intentionally about
// our teacher PROMISES (not fabricated individual bios) so it stays truthful and
// easy to edit. Replace the copy in CONTENT with your real teacher commitments.

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { FaChild } from 'react-icons/fa6';
import { PiMicrophoneStageLight } from 'react-icons/pi';
import { MdOutlineShield, MdTranslate } from 'react-icons/md';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';

const ICONS = [FaChild, PiMicrophoneStageLight, MdOutlineShield, MdTranslate];

const CONTENT = {
  ar: {
    eyebrow: 'معلّمونا',
    title: 'معلّمون تطمئن لهم مع طفلك',
    subtitle: 'نختار معلّمينا بعناية ليكونوا متخصّصين في تعليم الأطفال بصبر ولُطف.',
    cards: [
      { t: 'متخصّصون في الأطفال', d: 'أسلوب محبّب وصبور وتشجيع إيجابي يناسب الأعمار الصغيرة.' },
      { t: 'نطق وتجويد واضح', d: 'تلاوة سليمة بطيئة وواضحة تبني نُطق طفلك خطوة بخطوة.' },
      { t: 'بيئة آمنة ومطمئنة', d: 'جلسات يمكن لولي الأمر متابعتها، في إطار محترم وآمن للطفل.' },
      { t: 'ثنائيو اللغة', d: 'يشرحون بالعربية والإنجليزية ليفهم كل طفل مهما كانت لغته.' },
    ],
  },
  en: {
    eyebrow: 'Our teachers',
    title: 'Teachers you can trust with your child',
    subtitle: 'We choose our teachers carefully — specialized in teaching kids with patience and kindness.',
    cards: [
      { t: 'Specialized in kids', d: 'A loving, patient style with positive encouragement made for young learners.' },
      { t: 'Clear pronunciation & tajweed', d: 'Slow, correct recitation that builds your child’s pronunciation step by step.' },
      { t: 'A safe, calm space', d: 'Sessions parents can follow along, in a respectful and child-safe setting.' },
      { t: 'Bilingual', d: 'They explain in Arabic and English so every child understands.' },
    ],
  },
};

const MotionBox = motion.create(Box);

export default function Teachers() {
  const theme = useTheme();
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  return (
    <Section id="teachers" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        {c.cards.map((card, i) => {
          const Icon = ICONS[i];
          const color = colors[i % colors.length];
          return (
            <MotionBox
              key={card.t}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: `0 10px 28px ${alpha(color, 0.08)}`,
                height: '100%',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  mb: 2,
                  borderRadius: 3,
                  display: 'grid',
                  placeItems: 'center',
                  color,
                  bgcolor: alpha(color, 0.12),
                }}
              >
                <Icon size={32} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                {card.t}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {card.d}
              </Typography>
            </MotionBox>
          );
        })}
      </Box>
    </Section>
  );
}
