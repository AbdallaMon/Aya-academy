import {
  heroActionData,
  heroImagesData,
  heroTextData,
} from '@/shared/data/hero';
import { PageTheme } from '@/shared/types/general';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { HeroText } from './components/HeroText';
import { HeroActions } from './components/HeroActions';
import { HeroImage } from './components/HeroImage';

export default function Hero({
  pageTheme = 'light',
}: {
  pageTheme: PageTheme;
}) {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        // background: `linear-gradient(to bottom, ${colors.paperBackground} 0%, ${colors.background} 40%, ${colors.lightPrimary} 100%)`,
        position: 'relative',
      }}
      id="home"
    >
      <Box
        component="img"
        src={heroImagesData.background.src[pageTheme]}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          objectFit: 'cover',
          opacity: 1,
        }}
      />
      <Container maxWidth="lg">
        <Grid
          container
          spacing={4}
          sx={{
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <HeroText />
            <HeroActions />
            <Typography
              variant="body2"
              sx={{
                mt: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'text.secondary',
              }}
            >
              <heroTextData.noteIcon />
              {heroTextData.note}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <HeroImage pageTheme={pageTheme} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
