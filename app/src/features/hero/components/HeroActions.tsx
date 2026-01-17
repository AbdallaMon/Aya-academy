import { heroActionData } from '@/shared/data/hero';
import { Box, Button } from '@mui/material';

export function HeroActions() {
  const JourneyIcon = heroActionData.journey.icon;
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        mt: 4,
      }}
    >
      <Button
        variant="contained"
        href={heroActionData.journey.href}
        size="large"
        // startIcon={}
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {JourneyIcon && <JourneyIcon />}
        {heroActionData.journey.text}
      </Button>
      <Button
        variant="outlinedYellow"
        href={heroActionData.booking.href}
        size="large"
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          backgroundColor: 'background.white',
        }}
      >
        {heroActionData.booking.text}
      </Button>
    </Box>
  );
}
