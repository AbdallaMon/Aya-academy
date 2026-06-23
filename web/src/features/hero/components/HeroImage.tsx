import { heroImagesData } from '@/shared/data/hero';
import { PageTheme } from '@/shared/types/general';
import { Box } from '@mui/material';

export function HeroImage({ pageTheme }: { pageTheme: PageTheme }) {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Box
        component="img"
        src={heroImagesData.main.src[pageTheme]}
        alt={heroImagesData.main.alt}
        sx={{
          maxWidth: '100%',
          maxHeight: { xs: 300, md: 600 },
          height: 'auto',
        }}
      />
    </Box>
  );
}
