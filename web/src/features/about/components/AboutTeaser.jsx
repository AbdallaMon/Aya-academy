import Link from 'next/link';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { localePath } from '@/i18n/routing.js';
import { getAboutTeaserContent } from '../data.js';

export default function AboutTeaser({ lng }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const content = getAboutTeaserContent(language);

  return (
    <MarketingSection alt maxWidth="md">
      <Box sx={{ textAlign: 'center' }}>
        <Typography component="p" sx={{ color: 'brandText', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 13, mb: 1.5 }}>
          {content.eyebrow}
        </Typography>
        <Typography component="h2" variant="h2" sx={{ mb: 1.5 }}>
          {content.title}
        </Typography>
        <Typography component="p" variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, lineHeight: 1.8, maxWidth: 760, mx: 'auto' }}>
          {content.description}
        </Typography>
        <Stack direction="row" useFlexGap flexWrap="wrap" justifyContent="center" spacing={1} sx={{ my: 3 }}>
          {content.audiences.map((audience) => (
            <Chip key={audience} label={audience} variant="outlined" sx={{ fontWeight: 700 }} />
          ))}
        </Stack>
        <Link href={localePath(language, '/about')} style={{ textDecoration: 'none' }}>
          <Button variant="outlined" size="large">
            {content.cta}
          </Button>
        </Link>
      </Box>
    </MarketingSection>
  );
}
