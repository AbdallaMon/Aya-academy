import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import { PiBookOpenText, PiCertificate, PiTranslate, PiMosque } from 'react-icons/pi';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { CONTACT_WHATSAPP_URL } from '@/features/contact/data.js';
import {
  programFamilies,
  programFamilyText,
  services,
  serviceText,
} from '@/features/services/data.js';
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
    pathsLabel: 'صفحات البرامج التفصيلية',
    cta: 'استكشف المسارات',
    ijazahTitle: 'الإجازات القرآنية',
    ijazahDescription: 'تُتيح أكاديمية آية منح الإجازات القرآنية للطلاب المؤهلين، بعد استيفاء متطلبات الإجازة.',
    ijazahCta: 'استفسر عن الإجازة',
    ijazahMessage: 'السلام عليكم، أود الاستفسار عن الإجازات القرآنية في أكاديمية آية وشروط الحصول عليها.',
  },
  en: {
    eyebrow: 'Our Programs',
    title: 'Learn Quran, Arabic and Islam in one place',
    subtitle: 'Complete programs for children, teenagers and adults, taught by qualified teachers on a plan that fits every student’s level.',
    pathsLabel: 'Detailed program pages',
    cta: 'Explore learning paths',
    ijazahTitle: 'Quran Ijazah',
    ijazahDescription: 'Ayah Academy offers Quran Ijazah to eligible students who fulfil its requirements.',
    ijazahCta: 'Enquire about Ijazah',
    ijazahMessage: 'Assalamu alaikum, I would like to enquire about Quran Ijazah at Ayah Academy and the eligibility requirements.',
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
          const familyServices = services.filter((service) => family.serviceKeys.includes(service.key));
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
              <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 2.5, paddingInlineStart: '20px', color: 'text.secondary', flex: 1 }}>
                {copy.topics.map((topic) => (
                  <Typography
                    component="li"
                    variant="body2"
                    key={topic}
                    sx={{
                      lineHeight: 1.6,
                      ...(family.key === 'quran' && topic === content.ijazahTitle && {
                        color: style.color,
                        fontWeight: 800,
                      }),
                    }}
                  >
                    {topic}
                  </Typography>
                ))}
              </Box>
              <Box
                component="nav"
                aria-label={`${copy.title}: ${content.pathsLabel}`}
                sx={{ mb: 2.5 }}
              >
                <Typography component="p" variant="overline" sx={{ mb: 0.75, color: 'text.secondary', fontWeight: 800 }}>
                  {content.pathsLabel}
                </Typography>
                <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, m: 0, paddingInlineStart: '20px' }}>
                  {familyServices.map((service) => {
                    const serviceCopy = serviceText(service, language);
                    return (
                      <Box component="li" key={service.slug}>
                        <Link
                          href={localePath(language, `/services/${service.slug}`)}
                          style={{ color: style.color, fontWeight: 700, textUnderlineOffset: '3px' }}
                        >
                          {serviceCopy.title}
                        </Link>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
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
      <Box
        component="aside"
        aria-labelledby="ijazah-title"
        sx={{
          mt: 3,
          p: { xs: 2.5, md: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: STYLES.quran.border,
          bgcolor: STYLES.quran.soft,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'grid', placeItems: 'center', width: { xs: 64, md: 80 }, height: { xs: 64, md: 80 }, flexShrink: 0, borderRadius: '50%', color: STYLES.quran.color, bgcolor: STYLES.quran.soft, border: '1px solid', borderColor: STYLES.quran.border }}>
            <PiCertificate size={40} aria-hidden />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography id="ijazah-title" component="h3" variant="h5" sx={{ fontWeight: 900, mb: 0.75 }}>
              {content.ijazahTitle}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 650 }}>
              {content.ijazahDescription}
            </Typography>
          </Box>
        </Box>
        <Button
          component="a"
          href={`${CONTACT_WHATSAPP_URL}?text=${encodeURIComponent(content.ijazahMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          size="large"
          sx={{ flexShrink: 0, minWidth: { sm: 220 } }}
        >
          {content.ijazahCta}
        </Button>
      </Box>
    </MarketingSection>
  );
}

export default Programs;
