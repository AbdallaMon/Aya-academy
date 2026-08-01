import Link from 'next/link';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { localePath } from '@/i18n/routing.js';
import {
  getServicePageText,
  programFamilyText,
  serviceText,
} from '../data.js';

const PAGE_TEXT = {
  ar: {
    back: 'كل البرامج',
    overviewEyebrow: 'عن هذه المجموعة',
    topicsTitle: 'البرامج والموضوعات المتاحة',
    pathsEyebrow: 'اختر مسارك',
    pathsTitle: 'مسارات تعلّم بتفاصيل كاملة',
    pathCta: 'اعرف تفاصيل البرنامج',
    benefitsEyebrow: 'أسلوب التعلّم',
    benefitsTitle: 'كيف نساعد الطالب على التقدّم؟',
    faqTitle: 'أسئلة شائعة',
  },
  en: {
    back: 'All programs',
    overviewEyebrow: 'About this program group',
    topicsTitle: 'Available programs and topics',
    pathsEyebrow: 'Choose your path',
    pathsTitle: 'Detailed learning paths',
    pathCta: 'Explore the program',
    benefitsEyebrow: 'Learning approach',
    benefitsTitle: 'How we support student progress',
    faqTitle: 'Frequently asked questions',
  },
};

export default function ProgramFamilyPage({ lng, family, services }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const content = programFamilyText(family, language);
  const pageText = PAGE_TEXT[language];
  const servicePageText = getServicePageText(language);

  return (
    <>
      <Box component="header" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 5, md: 7 }, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md">
          <Link href={localePath(language, '/services')} style={{ textDecoration: 'none' }}>
            <Button size="small" sx={{ mb: 3 }}>
              {pageText.back}
            </Button>
          </Link>
          <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
            {content.title}
          </Typography>
          <Typography component="p" variant="h6" sx={{ fontWeight: 400, color: 'text.secondary', lineHeight: 1.8, maxWidth: 780 }}>
            {content.description}
          </Typography>
        </Container>
      </Box>

      <MarketingSection maxWidth="md" eyebrow={pageText.overviewEyebrow} title={content.introTitle}>
        <Stack spacing={2}>
          {content.intro.map((paragraph) => (
            <Typography key={paragraph} color="text.secondary" sx={{ fontSize: { xs: 17, md: 18 }, lineHeight: 1.95 }}>
              {paragraph}
            </Typography>
          ))}
        </Stack>
      </MarketingSection>

      <MarketingSection alt maxWidth="md" title={pageText.topicsTitle}>
        <Box
          component="ul"
          sx={{
            m: 0,
            p: { xs: 2.5, md: 3.5 },
            paddingInlineStart: { xs: '44px', md: '52px' },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.5,
            borderRadius: 4,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {content.topics.map((topic) => (
            <Typography component="li" key={topic} color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {topic}
            </Typography>
          ))}
        </Box>
      </MarketingSection>

      <MarketingSection eyebrow={pageText.pathsEyebrow} title={pageText.pathsTitle}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: services.length === 1 ? 'minmax(0, 600px)' : 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {services.map((service) => {
            const copy = serviceText(service, language);
            return (
              <Box key={service.slug} component="article" sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                <Typography component="h3" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  {copy.title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
                  {copy.description}
                </Typography>
                <Link href={localePath(language, `/services/${service.slug}`)} style={{ alignSelf: 'flex-start', marginTop: 'auto', textDecoration: 'none' }}>
                  <Button variant="outlined">{pageText.pathCta}</Button>
                </Link>
              </Box>
            );
          })}
        </Box>
      </MarketingSection>

      <MarketingSection alt eyebrow={pageText.benefitsEyebrow} title={pageText.benefitsTitle}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {content.benefits.map((benefit, index) => (
            <Box key={benefit.title} component="article" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Box aria-hidden sx={{ width: 40, height: 40, mb: 2, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 900 }}>
                {index + 1}
              </Box>
              <Typography component="h3" variant="h6" sx={{ fontWeight: 800, mb: 0.75 }}>
                {benefit.title}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {benefit.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </MarketingSection>

      <MarketingSection maxWidth="md" title={pageText.faqTitle}>
        <Stack spacing={1.5}>
          {content.faqs.map((item, index) => (
            <Box component="details" key={item.q} open={index === 0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
              <Box component="summary" sx={{ px: { xs: 2, md: 3 }, py: 2, cursor: 'pointer', fontWeight: 800, color: 'text.primary' }}>
                {item.q}
              </Box>
              <Typography color="text.secondary" sx={{ px: { xs: 2, md: 3 }, pb: 2.5, lineHeight: 1.9 }}>
                {item.a}
              </Typography>
            </Box>
          ))}
        </Stack>
      </MarketingSection>

      <MarketingSection alt maxWidth="md">
        <Box sx={{ textAlign: 'center', p: { xs: 3, md: 5 }, borderRadius: 5, border: '1px solid', borderColor: 'primary.main', bgcolor: 'background.default' }}>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 900, mb: 1.5 }}>
            {servicePageText.trialTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 600, mx: 'auto', mb: 3 }}>
            {servicePageText.trial}
          </Typography>
          <Link href={localePath(language, '/register')} style={{ textDecoration: 'none' }}>
            <Button variant="contained" size="large">
              {servicePageText.trialCta}
            </Button>
          </Link>
        </Box>
      </MarketingSection>
    </>
  );
}
