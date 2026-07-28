import { Box, Button, Container, Stack, Typography } from '@mui/material';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { getServicePageText, serviceText } from '../data.js';
import { localePath } from '@/i18n/routing.js';

export default function ServiceDetailsPage({ lng, service }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const text = getServicePageText(language);
  const serviceCopy = serviceText(service, language);
  const facts = [
    {
      title: text.audienceTitle,
      body: serviceCopy.audience || text.audience,
      items: serviceCopy.audienceItems,
    },
    {
      title: text.focusTitle,
      body: serviceCopy.focus,
      items: serviceCopy.focusItems,
    },
    { title: text.formatTitle, body: serviceCopy.format || text.format },
    { title: text.durationTitle, body: serviceCopy.duration || text.duration },
  ];
  const lessonSteps = serviceCopy.lessonSteps || [];
  const sections = serviceCopy.sections || [];
  const faqs = serviceCopy.faqs || [];

  return (
    <>
      <Box component="section" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 5, md: 7 }, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md">
          <Button
            href={localePath(language, '/services')}
            size="small"
            sx={{ mb: 3 }}
          >
            {text.backToServices}
          </Button>
          <Typography component="h1" variant="h1" sx={{ mb: 2 }}>{serviceCopy.title}</Typography>
          <Typography component="p" variant="h6" sx={{ fontWeight: 400, color: 'text.secondary', lineHeight: 1.8, maxWidth: 760 }}>{serviceCopy.description}</Typography>
        </Container>
      </Box>

      <MarketingSection maxWidth="md">
        <Stack spacing={2}>
          {facts.map((fact) => (
            <Box key={fact.title} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Typography component="h2" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{fact.title}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>{fact.body}</Typography>
              {fact.items?.length > 0 && (
                <Box
                  component="ul"
                  sx={{
                    mt: 1.5,
                    mb: 0,
                    paddingInlineStart: '24px',
                    display: 'grid',
                    gap: 1,
                    color: 'text.secondary',
                  }}
                >
                  {fact.items.map((item) => (
                    <Box component="li" key={item}>
                      <Typography component="span" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </MarketingSection>

      {lessonSteps.length > 0 && (
        <MarketingSection
          alt
          maxWidth="md"
          eyebrow={text.detailsEyebrow}
          title={text.lessonStepsTitle}
        >
          <Box
            component="ol"
            sx={{
              m: 0,
              paddingInlineStart: '24px',
              display: 'grid',
              gap: 2,
              '& li::marker': {
                color: 'brandText',
                fontWeight: 900,
              },
            }}
          >
            {lessonSteps.map((step) => (
              <Box
                component="li"
                key={step}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>
        </MarketingSection>
      )}

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
                <Typography component="h3" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
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
          <Button
            href={localePath(language, '/register')}
            variant="contained"
            size="large"
          >
            {text.trialCta}
          </Button>
        </Box>
      </MarketingSection>
    </>
  );
}
