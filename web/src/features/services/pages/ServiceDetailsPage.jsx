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
    { title: text.audienceTitle, body: text.audience },
    { title: text.focusTitle, body: serviceCopy.focus },
    { title: text.formatTitle, body: text.format },
    { title: text.durationTitle, body: text.duration },
  ];

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
