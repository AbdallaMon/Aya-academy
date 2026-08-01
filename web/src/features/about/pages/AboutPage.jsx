import Link from 'next/link';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { localePath } from '@/i18n/routing.js';
import { getAboutContent } from '../data.js';

export default function AboutPage({ lng }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const content = getAboutContent(language);

  return (
    <>
      <Box component="header" sx={{ py: { xs: 7, md: 11 }, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography component="p" sx={{ color: 'brandText', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 13, mb: 1.5 }}>
            {content.eyebrow}
          </Typography>
          <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
            {content.title}
          </Typography>
          <Typography component="p" variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, lineHeight: 1.9, maxWidth: 820, mx: 'auto' }}>
            {content.description}
          </Typography>
        </Container>
      </Box>

      <MarketingSection maxWidth="md" title={content.storyTitle}>
        <Stack spacing={2}>
          {content.story.map((paragraph) => (
            <Typography key={paragraph} color="text.secondary" sx={{ fontSize: { xs: 17, md: 18 }, lineHeight: 2 }}>
              {paragraph}
            </Typography>
          ))}
        </Stack>
      </MarketingSection>

      <MarketingSection
        alt
        eyebrow={content.whoEyebrow}
        title={content.whoTitle}
        subtitle={content.whoDescription}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {content.audiences.map((audience, index) => (
            <Box key={audience.title} component="article" sx={{ p: { xs: 3, md: 3.5 }, borderRadius: 4, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Box aria-hidden sx={{ width: 42, height: 42, mb: 2, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 900 }}>
                {index + 1}
              </Box>
              <Typography component="h2" variant="h5" sx={{ fontWeight: 800, mb: 1.25 }}>
                {audience.title}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>
                {audience.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </MarketingSection>

      <MarketingSection
        eyebrow={content.approachEyebrow}
        title={content.approachTitle}
        subtitle={content.approachDescription}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          {content.approach.map((point) => (
            <Box key={point.title} component="article" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 800, mb: 0.75 }}>
                {point.title}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {point.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </MarketingSection>

      <MarketingSection alt>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
          {[
            { title: content.missionTitle, body: content.mission },
            { title: content.visionTitle, body: content.vision },
          ].map((item) => (
            <Box key={item.title} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, bgcolor: 'background.default', borderTop: '4px solid', borderColor: 'primary.main' }}>
              <Typography component="h2" variant="h4" sx={{ fontWeight: 900, mb: 1.5 }}>
                {item.title}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>
                {item.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </MarketingSection>

      <MarketingSection maxWidth="md">
        <Box sx={{ textAlign: 'center', p: { xs: 3, md: 5 }, borderRadius: 5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography component="blockquote" variant="h5" sx={{ m: 0, mb: 3, color: 'primary.main', fontWeight: 800, lineHeight: 1.8 }}>
            {content.quote}
          </Typography>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 900, mb: 1.5 }}>
            {content.closingTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.9, maxWidth: 650, mx: 'auto', mb: 3 }}>
            {content.closingDescription}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Link href={localePath(language, '/services')} style={{ textDecoration: 'none' }}>
              <Button variant="outlined" size="large" fullWidth>
                {content.programsCta}
              </Button>
            </Link>
            <Link href={localePath(language, '/register')} style={{ textDecoration: 'none' }}>
              <Button variant="contained" size="large" fullWidth>
                {content.trialCta}
              </Button>
            </Link>
          </Stack>
        </Box>
      </MarketingSection>
    </>
  );
}
