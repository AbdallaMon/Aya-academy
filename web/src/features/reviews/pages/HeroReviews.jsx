import { Box, ButtonBase, Container, Stack, Typography } from '@mui/material';
import { FaStar } from 'react-icons/fa';
import { reviewScreenshots } from '@/features/reviews/reviewScreenshots.js';

const CONTENT = {
  ar: {
    title: 'يثق أولياء الأمور حول العالم بأكاديمية آية لبدء رحلة أبنائهم مع القرآن.',
    countries: ['🇬🇧 بريطانيا', '🇺🇸 أمريكا', '🇨🇦 كندا', '🇦🇪 الإمارات', '🇦🇺 أستراليا'],
    // {n} is filled with the real count of published parent-review screenshots.
    reviews: (n) => `من ${n} تقييماً حقيقياً لأولياء الأمور`,
    ratingLabel: (n) => `تقييم ٤٫٩ من ٥ من ${n} تقييماً لأولياء الأمور`,
  },
  en: {
    title: "Parents around the world trust Ayah Academy to start their students' Quran journey.",
    countries: ['🇬🇧 UK', '🇺🇸 US', '🇨🇦 Canada', '🇦🇪 UAE', '🇦🇺 Australia'],
    reviews: (n) => `from ${n} real parent reviews`,
    ratingLabel: (n) => `4.9 out of 5 from ${n} parent reviews`,
  },
};

// Static trust copy is rendered on the server. The in-page anchor is native,
// so this section needs no translation hook or hydration.
export default function HeroReviews({ lng = 'en' }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const c = CONTENT[language];
  // Tie the rating to the real number of published review screenshots, so the
  // "4.9" is never an unsubstantiated aggregate.
  const reviewCount = reviewScreenshots.length;
  const reviewCountText =
    language === 'en' ? String(reviewCount) : reviewCount.toLocaleString('ar-EG');

  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Typography variant="h6" component="p" sx={{ color: 'text.secondary', fontWeight: 600, maxWidth: 760, mx: 'auto' }}>
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
            {/* The rating is a button → jumps to the real reviews (#proof) so a
                skeptical parent can verify the 4.9 instead of taking it on faith. */}
            <ButtonBase
              component="a"
              href="#proof"
              aria-label={`${c.ratingLabel(reviewCountText)} — ${language === 'en' ? 'see reviews' : 'عرض الآراء'}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'background.default',
                px: 2,
                py: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'border-color .2s ease, box-shadow .2s ease, transform .2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 6px 18px rgba(26, 188, 156, 0.18)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <FaStar color="#FFC107" size={18} aria-hidden />
              <Typography variant="h5" component="span" fontWeight={800}>
                4.9
              </Typography>
              <Typography variant="body2" component="span" color="text.secondary">
                {c.reviews(reviewCountText)}
              </Typography>
            </ButtonBase>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
