'use client';

import { Box, Container, Stack, Typography } from '@mui/material';
import { FaStar } from 'react-icons/fa';
import { useTranslation } from '@/i18n/client.js';

const CONTENT = {
  ar: {
    title: 'يثق أولياء الأمور حول العالم بأكاديمية آية لبدء رحلة أبنائهم مع القرآن.',
    countries: ['🇬🇧 بريطانيا', '🇺🇸 أمريكا', '🇨🇦 كندا', '🇦🇪 الإمارات', '🇦🇺 أستراليا'],
    reviews: 'من ١٥٠٠ تقييم',
  },
  en: {
    title: "Parents around the world trust Aya Academy to start their kids' Quran journey.",
    countries: ['🇬🇧 UK', '🇺🇸 US', '🇨🇦 Canada', '🇦🇪 UAE', '🇦🇺 Australia'],
    reviews: 'from 1,500 reviews',
  },
};

export default function HeroReviews() {
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];

  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600, maxWidth: 760, mx: 'auto' }}>
            {c.title}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            flexWrap="wrap"
            gap={{ xs: 1.5, md: 3 }}
            sx={{ mt: 2.5 }}
          >
            <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1.5}>
              {c.countries.map((country) => (
                <Typography key={country} variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {country}
                </Typography>
              ))}
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ bgcolor: 'background.default', px: 2, py: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
            >
              <FaStar color="#FFC107" size={18} />
              <Typography variant="h5" component="span" fontWeight={800}>
                4.9
              </Typography>
              <Typography variant="body2" component="span" color="text.secondary">
                {c.reviews}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
