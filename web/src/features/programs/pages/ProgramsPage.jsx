import Link from 'next/link';
import { Box, Chip, Stack, Typography } from '@mui/material';
import {
  PiBookBookmark,
  PiWaveform,
  PiBookOpenText,
  PiChatsCircle,
  PiTranslate,
  PiMosque,
} from 'react-icons/pi';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { services, serviceText } from '@/features/services/data.js';
import { localePath } from '@/i18n/routing.js';

const ICONS = {
  memorization: PiBookBookmark,
  tajweed: PiWaveform,
  reading: PiBookOpenText,
  speaking: PiChatsCircle,
  quranicArabic: PiTranslate,
  islamicStudies: PiMosque,
};

const CONTENT = {
  ar: {
    eyebrow: 'برامجنا',
    title: 'المواد المتاحة للدراسة',
    subtitle: 'برامج لكل الأعمار — للصغار والكبار — يقدّمها معلّمون مؤهّلون بخطة تناسب مستواك.',
    families: { quran: 'برامج القرآن', arabic: 'اللغة العربية', islamic: 'التربية الإسلامية' },
  },
  en: {
    eyebrow: 'Our Programs',
    title: 'Subjects you can study',
    subtitle: 'Programs for all ages — from young learners to adults — taught by qualified teachers on a plan that fits your level.',
    families: { quran: "Qur'an Programs", arabic: 'Arabic Language', islamic: 'Islamic Education' },
  },
};

const FAMILY_BY_KEY = {
  memorization: 'quran',
  tajweed: 'quran',
  reading: 'arabic',
  speaking: 'arabic',
  quranicArabic: 'arabic',
  islamicStudies: 'islamic',
};

const FAMILY_COLOR = { quran: 'primary', arabic: 'secondary', islamic: 'success' };

const PROGRAM_STYLE = {
  memorization: { color: '#0f766e', border: '#99d5cb' },
  tajweed: { color: '#1d4ed8', border: '#a9bff5' },
  reading: { color: '#7c3aed', border: '#cbb6f6' },
  speaking: { color: '#c2410c', border: '#f2b99d' },
  quranicArabic: { color: '#0369a1', border: '#9dcce6' },
  islamicStudies: { color: '#a21caf', border: '#e3afe8' },
};

// A pure Server Component: titles, descriptions and links are present in the
// first HTML response. Only hover styling remains; there is no entrance motion.
export function Programs({ lng = 'ar' }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const c = CONTENT[language];

  return (
    <MarketingSection id="programs" alt eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {services.map((service) => {
          const text = serviceText(service, language);
          const family = FAMILY_BY_KEY[service.key];
          const color = FAMILY_COLOR[family];
          const Icon = ICONS[service.key];
          const style = PROGRAM_STYLE[service.key];

          return (
            <Link
              key={service.slug}
              href={localePath(language, `/services/${service.slug}`)}
              style={{ color: 'inherit', display: 'block', height: '100%', textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 214,
                  p: 2.5,
                  borderRadius: 3.5,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'box-shadow .2s ease, border-color .2s ease',
                  '&:hover': { boxShadow: 3, borderColor: style.border },
                  '&:focus-visible': { outline: '3px solid', outlineColor: `${color}.main`, outlineOffset: 3 },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      flexShrink: 0,
                      borderRadius: 3,
                      display: 'grid',
                      placeItems: 'center',
                      color: style.color,
                      bgcolor: '#fff',
                      border: '2px solid',
                      borderColor: style.border,
                      boxShadow: `0 5px 14px ${style.border}66`,
                    }}
                  >
                    <Icon size={30} color="currentColor" strokeWidth={2.1} />
                  </Box>
                  <Chip
                    size="small"
                    label={c.families[family]}
                    variant="outlined"
                    sx={{
                      height: 26,
                      fontSize: 12,
                      fontWeight: 800,
                      color: style.color,
                      bgcolor: '#fff',
                      borderColor: style.border,
                    }}
                  />
                </Stack>
                <Typography variant="subtitle1" component="h3" fontWeight={800} sx={{ mb: 0.5 }}>{text.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>{text.description}</Typography>
              </Box>
            </Link>
          );
        })}
      </Box>
    </MarketingSection>
  );
}

export default Programs;
