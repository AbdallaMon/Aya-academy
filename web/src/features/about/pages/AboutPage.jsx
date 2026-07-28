import { Box, Container, Typography } from '@mui/material';
import { PiBookOpenText, PiChalkboardTeacher, PiHeart } from 'react-icons/pi';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { getAboutContent } from '../data.js';

const POINT_ICONS = [PiChalkboardTeacher, PiBookOpenText, PiHeart];

export default function AboutPage({ lng }) {
  const content = getAboutContent(lng);

  return (
    <>
      <Box component="header" sx={{ py: { xs: 7, md: 11 }, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography component="p" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 13, mb: 1.5 }}>
            {content.eyebrow}
          </Typography>
          <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
            {content.title}
          </Typography>
          <Typography component="p" variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, lineHeight: 1.9, maxWidth: 760, mx: 'auto' }}>
            {content.description}
          </Typography>
        </Container>
      </Box>

      <MarketingSection maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {content.points.map((point, index) => {
            const Icon = POINT_ICONS[index];
            return (
              <Box key={point.title} component="article" sx={{ p: { xs: 3, md: 3.5 }, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Box sx={{ width: 56, height: 56, display: 'grid', placeItems: 'center', borderRadius: 3, color: 'primary.main', bgcolor: 'rgba(12, 124, 111, 0.08)', border: '1px solid', borderColor: 'primary.main', mb: 2.5 }}>
                  <Icon size={29} aria-hidden />
                </Box>
                <Typography component="h2" variant="h5" sx={{ fontWeight: 800, mb: 1.25 }}>
                  {point.title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>
                  {point.body}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </MarketingSection>
    </>
  );
}
