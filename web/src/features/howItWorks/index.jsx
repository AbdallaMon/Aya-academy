'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { MdOutlinePersonAddAlt } from 'react-icons/md';
import { IoVideocamOutline } from 'react-icons/io5';
import { PiHeadphonesLight } from 'react-icons/pi';
import { SlBadge } from 'react-icons/sl';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';

const ICONS = [MdOutlinePersonAddAlt, IoVideocamOutline, PiHeadphonesLight, SlBadge];

const CONTENT = {
  ar: {
    title: 'كيف نتعلّم في آية؟',
    subtitle: 'خطوات بسيطة وممتعة للأطفال وأولياء الأمور',
    steps: [
      { t: 'سجّل واختر المستوى', d: 'أخبرنا بعمر طفلك وخبرته، ونضعه في المستوى المناسب له تماماً.' },
      { t: 'دروس مباشرة أو موجّهة', d: 'يحضر الأطفال جلسات مباشرة أو يتابعون دروساً قصيرة بشرح واضح وبسيط.' },
      { t: 'تدرّب وكرّر وأتقِن', d: 'تلاوة بطيئة وتمارين صوتية وتكرار لطيف يبني ثقة الطفل خطوة بخطوة.' },
      { t: 'اجمع النجوم والأوسمة', d: 'يفتح الأطفال نجوماً وأوسمة جميلة كلّما حفظوا وفهموا أكثر.' },
    ],
  },
  en: {
    title: 'How Aya Academy works',
    subtitle: 'Simple, joyful steps for kids and parents',
    steps: [
      { t: 'Sign up & pick a level', d: "Tell us your child's age and experience, and we'll match the perfect level." },
      { t: 'Live or guided lessons', d: 'Kids join live sessions or follow short video lessons with clear, simple explanations.' },
      { t: 'Practice, recite, repeat', d: 'Slow recitation, audio practice and gentle repetition build confidence step by step.' },
      { t: 'Earn stars & badges', d: 'Kids unlock lovely stars and badges as they memorize and understand more.' },
    ],
  },
};

const MotionBox = motion.create(Box);

export default function HowItWorks() {
  const theme = useTheme();
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];

  return (
    <Section id="how-it-works" alt eyebrow={lng === 'en' ? 'How it works' : 'كيف نعمل'} title={c.title} subtitle={c.subtitle}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        {c.steps.map((step, i) => {
          const Icon = ICONS[i];
          return (
            <MotionBox
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              sx={{
                position: 'relative',
                p: 3,
                pt: 3.5,
                borderRadius: 4,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.06)}`,
                height: '100%',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -16,
                  insetInlineEnd: 16,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  color: 'secondary.contrastText',
                  bgcolor: 'secondary.main',
                  boxShadow: `0 6px 14px ${alpha(theme.palette.secondary.main, 0.4)}`,
                }}
              >
                {i + 1}
              </Box>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 3,
                  display: 'grid',
                  placeItems: 'center',
                  mb: 2,
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <Icon size={30} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                {step.t}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {step.d}
              </Typography>
            </MotionBox>
          );
        })}
      </Box>
    </Section>
  );
}
