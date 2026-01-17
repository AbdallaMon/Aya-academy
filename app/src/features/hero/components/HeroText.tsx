import { heroTextData } from '@/shared/data/hero';
import { Box, Typography } from '@mui/material';

export function HeroText() {
  return (
    <Box>
      <Typography
        variant="h6"
        color="success.main"
        sx={{
          fontWeight: 400,
          fontSize: {
            xs: '13px',
            md: '15px',
          },
        }}
      >
        {heroTextData.eyebrow.toUpperCase()}
      </Typography>
      <Typography variant="h1" sx={{ mt: 2, mb: { xs: 2, md: 3 } }}>
        {heroTextData.title}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 400,
        }}
      >
        {heroTextData.description}
      </Typography>
    </Box>
  );
}
