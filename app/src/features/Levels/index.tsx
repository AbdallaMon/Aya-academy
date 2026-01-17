import { levelsData } from '@/shared/data/levels';
import { PageTheme } from '@/shared/types/general';
import {
  getCurrentColorScheme,
  sectionYPadding,
} from '@/shared/utlis/constants';
import { Box, Container, Grid, lighten, Typography } from '@mui/material';
import { LevelCard } from './components/LevelCard';

export function Levels({ pageTheme }: { pageTheme: PageTheme }) {
  const colors = getCurrentColorScheme(pageTheme);
  const isLightMode = pageTheme === 'light';
  return (
    <Box
      sx={{
        py: sectionYPadding,
        background: `linear-gradient(to bottom, ${colors.background} 0%, ${lighten(isLightMode ? colors.primary : colors.lightPrimary, isLightMode ? 0.8 : 0.1)} 100%)`,
        px: 1,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 2 }}>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography
                variant="h1"
                component={'h2'}
                gutterBottom
                sx={{
                  color: 'primary.main',
                }}
              >
                {levelsData.title}
              </Typography>
              <Typography variant="h5" mb={4} mt={-1}>
                {levelsData.subTitle}
              </Typography>
              <Typography variant="body1">{levelsData.description}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} container spacing={2}>
            {levelsData.levels.map((level) => (
              <Grid size={{ xs: 12, md: 6 }} key={level.number}>
                <LevelCard level={level} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
