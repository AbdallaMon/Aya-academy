'use client';

// Programs — "what we teach" section. A single compact grid of every subject Aya
// offers; each card carries a small colour-coded tag for its family (Qur'an /
// Arabic / Islamic) so the eye still groups them without three tall separate bands.
// Purely informational (no per-card CTA): the page already carries the pricing +
// free-session CTAs. One general audience line makes it clear the programs suit
// every age — children and adults. Colours come from the live MUI theme so
// light/dark toggling stays instant.

import { Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  PiBookBookmark,
  PiWaveform,
  PiBookOpenText,
  PiChatsCircle,
  PiTranslate,
  PiMosque,
} from 'react-icons/pi';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';

const ICONS = {
  memorization: PiBookBookmark,
  tajweed: PiWaveform,
  reading: PiBookOpenText,
  speaking: PiChatsCircle,
  quranicArabic: PiTranslate,
  islamicStudies: PiMosque,
};

// Each program tagged with a family key; the family drives its accent colour and
// tag label, keeping the visual grouping without separate bands.
const CONTENT = {
  ar: {
    eyebrow: 'برامجنا',
    title: 'المواد المتاحة للدراسة',
    subtitle: 'برامج لكل الأعمار — أطفالًا وكبارًا — يقدّمها معلّمون مؤهّلون بخطة تناسب مستواك.',
    families: { quran: 'برامج القرآن', arabic: 'اللغة العربية', islamic: 'التربية الإسلامية' },
    programs: [
      { key: 'memorization', family: 'quran', name: 'تحفيظ القرآن', desc: 'حفظ متقَن بالتكرار والمراجعة على يد معلّمين مؤهّلين.' },
      { key: 'tajweed', family: 'quran', name: 'دورات التجويد', desc: 'أحكام التلاوة الصحيحة من المخارج والصفات حتى إتقان الأداء.' },
      { key: 'reading', family: 'arabic', name: 'العربية للقراءة', desc: 'من الحروف إلى قراءة النصوص بطلاقة وثقة.' },
      { key: 'speaking', family: 'arabic', name: 'العربية للمحادثة', desc: 'مهارات التحدث والاستماع للتواصل بالعربية في الحياة اليومية.' },
      { key: 'quranicArabic', family: 'arabic', name: 'عربية القرآن', desc: 'فهم مفردات وتراكيب القرآن للوصول إلى معانيه مباشرة.' },
      { key: 'islamicStudies', family: 'islamic', name: 'الدراسات الإسلامية', desc: 'العقيدة والعبادات والأخلاق والسيرة بأسلوب مبسَّط ومحبَّب.' },
    ],
  },
  en: {
    eyebrow: 'Our Programs',
    title: 'Subjects you can study',
    subtitle: 'Programs for every age — children and adults — taught by qualified teachers on a plan that fits your level.',
    families: { quran: "Qur'an Programs", arabic: 'Arabic Language', islamic: 'Islamic Education' },
    programs: [
      { key: 'memorization', family: 'quran', name: "Qur'an Memorization", desc: 'Solid memorization through repetition and review with qualified teachers.' },
      { key: 'tajweed', family: 'quran', name: 'Tajweed Courses', desc: 'Correct recitation rules — from articulation points to polished delivery.' },
      { key: 'reading', family: 'arabic', name: 'Arabic for Reading', desc: 'From letters to reading texts fluently and confidently.' },
      { key: 'speaking', family: 'arabic', name: 'Arabic for Speaking', desc: 'Speaking and listening skills to communicate in Arabic in everyday life.' },
      { key: 'quranicArabic', family: 'arabic', name: "Qur'anic Arabic", desc: 'Understand Qur’anic vocabulary and structures to reach the meanings directly.' },
      { key: 'islamicStudies', family: 'islamic', name: 'Islamic Studies', desc: 'Creed, worship, manners and prophetic biography in a simple, engaging way.' },
    ],
  },
};

const MotionBox = motion.create(Box);

export function Programs() {
  const theme = useTheme();
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];
  const FAMILY_COLORS = {
    quran: theme.palette.primary.main,
    arabic: theme.palette.secondary.main,
    islamic: theme.palette.success.main,
  };

  return (
    <Section id="programs" alt eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {c.programs.map((program, i) => {
          const Icon = ICONS[program.key];
          const accent = FAMILY_COLORS[program.family];
          return (
            <MotionBox
              key={program.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
              whileHover={{ y: -4 }}
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: `0 6px 18px ${alpha(accent, 0.08)}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Box sx={{ width: 46, height: 46, flexShrink: 0, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: accent, bgcolor: alpha(accent, 0.12) }}>
                  <Icon size={24} />
                </Box>
                <Chip
                  size="small"
                  label={c.families[program.family]}
                  sx={{ height: 24, fontSize: 12, fontWeight: 700, bgcolor: alpha(accent, 0.1), color: accent }}
                />
              </Stack>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
                {program.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {program.desc}
              </Typography>
            </MotionBox>
          );
        })}
      </Box>
    </Section>
  );
}

export default Programs;
