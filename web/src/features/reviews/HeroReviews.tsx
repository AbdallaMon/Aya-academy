import { heroReviewsData } from '@/shared/data/reviews';
import { PageTheme } from '@/shared/types/general';
import { Box, Container, Typography } from '@mui/material';
import { FaStar } from 'react-icons/fa';
export default function HeroReviews({ pageTheme }: { pageTheme: PageTheme }) {
  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            py: { xs: 3, md: 4 },
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              color: 'text.secondary',
            }}
          >
            {heroReviewsData.title}
          </Typography>
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 2, md: 2 },
                mx: 'auto',
                justifyContent: 'center',
                mt: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                {heroReviewsData.countries.map((country) => (
                  <Typography
                    key={country}
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  >
                    {country}
                  </Typography>
                ))}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'background.paper',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                <FaStar color="#FFD700" size={16} />
                <Typography variant="h3" component="span">
                  {heroReviewsData.rating}
                </Typography>
                <Typography
                  variant="body1"
                  component="span"
                  color="text.secondary"
                >
                  from ({heroReviewsData.totalReviews} reviews)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
