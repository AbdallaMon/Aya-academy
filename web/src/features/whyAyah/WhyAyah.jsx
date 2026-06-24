'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { TbWorld } from 'react-icons/tb';
import { FiBookOpen, FiHeart } from 'react-icons/fi';
import { RiParentLine } from 'react-icons/ri';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';

const ICONS = [TbWorld, FiHeart, FiBookOpen, RiParentLine];

const CONTENT = {
  ar: {
    eyebrow: 'لماذا آية',
    title: 'لماذا أكاديمية آية؟',
    subtitle: 'أربعة أسباب تجعل تعلّم القرآن مع آية تجربة محبّبة وآمنة لطفلك.',
    reasons: [
      { t: 'شرح ثنائي اللغة', d: 'كل شيء يُشرح بالعربية والإنجليزية ببساطة للأطفال والأهل.' },
      { t: 'إيقاع مناسب للطفل', d: 'دروس قصيرة وتكرار لطيف وتشجيع إيجابي دائم.' },
      { t: 'المعنى لا الحفظ فقط', d: 'فهم ما يُتلى يبني ارتباطاً أعمق وحبّاً للقرآن.' },
      { t: 'مشاركة ولي الأمر', d: 'متابعة واضحة للتقدّم وإرشاد لطيف لدعم رحلة الطفل.' },
    ],
  },
  en: {
    eyebrow: 'Why Aya',
    title: 'Why Aya Academy?',
    subtitle: 'Four reasons learning Quran with Aya is a loving, safe experience for your child.',
    reasons: [
      { t: 'Bilingual explanations', d: 'Everything explained simply in Arabic and English for kids and parents.' },
      { t: 'Child-friendly pacing', d: 'Short lessons, gentle repetition and constant positive encouragement.' },
      { t: 'Meaning, not just memorizing', d: 'Understanding what they recite builds a deeper, loving connection.' },
      { t: 'Parent involvement', d: 'Clear progress tracking and gentle guidance to support the journey.' },
    ],
  },
};

const MotionBox = motion.create(Box);

export function WhyAyah() {
  const theme = useTheme();
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
  ];

  return (
    <Section id="why-ayah" alt eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        {c.reasons.map((reason, i) => {
          const Icon = ICONS[i];
          const color = colors[i % colors.length];
          return (
            <MotionBox
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              sx={{
                p: 3,
                borderRadius: 4,
                textAlign: 'center',
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: `0 10px 28px ${alpha(color, 0.08)}`,
                height: '100%',
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  color,
                  bgcolor: alpha(color, 0.12),
                }}
              >
                <Icon size={40} />
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                {reason.t}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {reason.d}
              </Typography>
            </MotionBox>
          );
        })}
      </Box>
    </Section>
  );
}

export default WhyAyah;
