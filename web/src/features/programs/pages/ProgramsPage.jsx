import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PiBookOpenText, PiTranslate, PiMosque } from 'react-icons/pi';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { programFamilies, programFamilyText } from '@/features/services/data.js';
import { localePath } from '@/i18n/routing.js';

const ICONS = {
  quran: PiBookOpenText,
  arabic: PiTranslate,
  islamic: PiMosque,
};

const STYLES = {
  quran: { color: '#0f766e', border: '#99d5cb', soft: 'rgba(15, 118, 110, 0.08)' },
  arabic: { color: '#7c3aed', border: '#cbb6f6', soft: 'rgba(124, 58, 237, 0.07)' },
  islamic: { color: '#a21caf', border: '#e3afe8', soft: 'rgba(162, 28, 175, 0.07)' },
};

const CONTENT = {
  ar: {
    eyebrow: 'برامجنا',
    title: 'تعلّم القرآن والعربية والإسلام في مكان واحد',
    subtitle: 'برامج متكاملة للأطفال واليافعين والكبار، يقدّمها معلّمون مؤهّلون بخطة تناسب مستوى كل طالب.',
    cta: 'استكشف المسارات',
  },
  en: {
    eyebrow: 'Our Programs',
    title: 'Learn Quran, Arabic and Islam in one place',
    subtitle: 'Complete programs for children, teenagers and adults, taught by qualified teachers on a plan that fits every student’s level.',
    cta: 'Explore learning paths',
  },
};

// Server-rendered curriculum: every official topic is present in the first HTML
// response while three clear families keep the homepage concise and scannable.
export function Programs({ lng = 'ar' }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const content = CONTENT[language];

  return (
    <MarketingSection id="programs" eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {programFamilies.map((family) => {
          const copy = programFamilyText(family, language);
          const Icon = ICONS[family.key];
          const style = STYLES[family.key];

          return (
            <Box
              key={family.key}
              component="article"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 2.5, md: 3 },
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: style.border,
                height: '100%',
              }}
            >
              <Box sx={{ width: 58, height: 58, mb: 2, borderRadius: 3, display: 'grid', placeItems: 'center', color: style.color, bgcolor: style.soft, border: '1px solid', borderColor: style.border }}>
                <Icon size={30} aria-hidden />
              </Box>
              <Typography component="h3" variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                {copy.title}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                {copy.description}
              </Typography>
              <Stack component="ul" spacing={1} sx={{ my: 2.5, paddingInlineStart: '20px', color: 'text.secondary', flex: 1 }}>
                {copy.topics.map((topic) => (
                  <Typography component="li" variant="body2" key={topic} sx={{ lineHeight: 1.6 }}>
                    {topic}
                  </Typography>
                ))}
              </Stack>
              <Link
                href={localePath(language, `/services/${family.slug}`)}
                style={{ alignSelf: 'flex-start', textDecoration: 'none' }}
              >
                <Button variant="outlined" sx={{ color: style.color, borderColor: style.border }}>
                  {content.cta}
                </Button>
              </Link>
            </Box>
          );
        })}
      </Box>
    </MarketingSection>
  );
}

export default Programs;
