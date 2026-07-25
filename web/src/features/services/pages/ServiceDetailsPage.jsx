import Link from 'next/link';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { getServicePageText, serviceText } from '../data.js';
import { localePath } from '@/i18n/routing.js';

export default function ServiceDetailsPage({ lng, service }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const text = getServicePageText(language);
  const serviceCopy = serviceText(service, language);
  const facts = [
    { title: text.audienceTitle, body: serviceCopy.audience || text.audience },
    { title: text.focusTitle, body: serviceCopy.focus },
    { title: text.formatTitle, body: serviceCopy.format || text.format },
    { title: text.durationTitle, body: serviceCopy.duration || text.duration },
  ];
  const sections = serviceCopy.sections || [];
  const faqs = serviceCopy.faqs || [];

  return (
    <>
      <Box component="section" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 5, md: 7 }, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md">
          <Link href={localePath(language, '/services')} style={{ display: 'inline-block', marginBottom: 24, textDecoration: 'none' }}>
            <Button size="small">{text.backToServices}</Button>
          </Link>
          <Typography component="h1" variant="h1" sx={{ mb: 2 }}>{serviceCopy.title}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, color: 'text.secondary', lineHeight: 1.8, maxWidth: 760 }}>{serviceCopy.description}</Typography>
        </Container>
      </Box>

      <MarketingSection maxWidth="md">
        <Stack spacing={2}>
          {facts.map((fact) => (
            <Box key={fact.title} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Typography component="h2" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{fact.title}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>{fact.body}</Typography>
            </Box>
          ))}
        </Stack>
      </MarketingSection>

      {sections.length > 0 && (
        <MarketingSection
          alt
          maxWidth="md"
          eyebrow={text.detailsEyebrow}
          title={text.detailsTitle}
        >
          <Stack spacing={2.5}>
            {sections.map((section) => (
              <Box
                key={section.title}
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography component="h2" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  {section.title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>
                  {section.body}
                </Typography>
              </Box>
            ))}
          </Stack>
        </MarketingSection>
      )}

      {faqs.length > 0 && (
        <MarketingSection maxWidth="md" title={text.faqTitle}>
          <Stack spacing={1.5}>
            {faqs.map((item, index) => (
              <Box
                component="details"
                key={item.q}
                open={index === 0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="summary"
                  sx={{
                    px: { xs: 2, md: 3 },
                    py: 2,
                    cursor: 'pointer',
                    fontWeight: 800,
                    color: 'text.primary',
                  }}
                >
                  {item.q}
                </Box>
                <Typography color="text.secondary" sx={{ px: { xs: 2, md: 3 }, pb: 2.5, lineHeight: 1.9 }}>
                  {item.a}
                </Typography>
              </Box>
            ))}
          </Stack>
        </MarketingSection>
      )}

      <MarketingSection alt maxWidth="md">
        <Box sx={{ textAlign: 'center', p: { xs: 3, md: 5 }, borderRadius: 5, border: '1px solid', borderColor: 'primary.main', bgcolor: 'background.default' }}>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 900, mb: 1.5 }}>{text.trialTitle}</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 600, mx: 'auto', mb: 3 }}>{text.trial}</Typography>
          <Link href={localePath(language, '/register')} style={{ textDecoration: 'none' }}>
            <Button variant="contained" size="large">{text.trialCta}</Button>
          </Link>
        </Box>
      </MarketingSection>
    </>
  );
}
