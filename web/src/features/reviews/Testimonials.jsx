'use client';

// Testimonials — parent review cards. The content is fully driven by the
// editable object in ./testimonialsData.js (add real reviews there).

import { Avatar, Box, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FaQuoteRight, FaStar } from 'react-icons/fa';
import { useTranslation } from '@/i18n/client.js';
import { sectionYPadding } from '@/shared/utlis/constants';
import { testimonials, testimonialsHeading } from './testimonialsData.js';

function Stars({ count = 5 }) {
  return (
    <Stack direction="row" spacing={0.25} sx={{ color: '#FFC107' }} aria-label={`${count}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} size={15} style={{ opacity: i < count ? 1 : 0.25 }} />
      ))}
    </Stack>
  );
}

export default function Testimonials() {
  const { lng } = useTranslation();
  const L = lng === 'en' ? 'en' : 'ar';
  const h = testimonialsHeading[L];

  return (
    <Box id="testimonials" sx={{ py: sectionYPadding, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h6" color="success.main" fontWeight={700}>
            {h.eyebrow.toUpperCase()}
          </Typography>
          <Typography variant="h2">{h.title}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, maxWidth: 640 }} color="text.secondary">
            {h.subtitle}
          </Typography>
        </Stack>

        <Grid container spacing={3} alignItems="stretch">
          {testimonials.map((item) => (
            <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: (th) => alpha(th.palette.primary.main, 0.5),
                    boxShadow: (th) => `0 18px 40px ${alpha(th.palette.primary.main, 0.16)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Stars count={item.rating} />
                    <Box sx={{ color: (th) => alpha(th.palette.primary.main, 0.35) }}>
                      <FaQuoteRight size={22} />
                    </Box>
                  </Stack>

                  <Typography
                    variant="body1"
                    sx={{ color: 'text.primary', lineHeight: 1.9, flex: 1, mb: 2.5 }}
                  >
                    {item.quote[L]}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar
                      src={item.avatar || undefined}
                      alt={item.name[L]}
                      sx={{
                        bgcolor: (th) => alpha(th.palette.primary.main, 0.15),
                        color: 'primary.main',
                        fontWeight: 800,
                      }}
                    >
                      {item.name[L]?.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={800} noWrap>
                        {item.name[L]} {item.country}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.role[L]}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
