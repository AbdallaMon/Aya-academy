import { childsDashboardData } from '@/shared/data/childs-dashboard';
import { Box, Container, Grid, lighten, List, Typography } from '@mui/material';
import { HomeFeature } from './components/HomeFeature';
import { PageTheme } from '@/shared/types/general';
import {
  getCurrentColorScheme,
  sectionYPadding,
} from '@/shared/utlis/constants';
import { ChildDashboardCard } from './components/ChildDashboardCard';

export function ChildDashboardHome({ pageTheme }: { pageTheme: PageTheme }) {
  const colors = getCurrentColorScheme(pageTheme);
  const isLightMode = pageTheme === 'light';
  return (
    <Box
      sx={{
        py: sectionYPadding,
        background: `linear-gradient(to bottom, ${colors.lightPrimary} 0%, ${isLightMode ? lighten(colors.paperBackground, 0.8) : colors.paperBackground} 100%)`,
        // backgroundColor: colors.paperBackground,
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={{ xs: 4, md: 2 }}
          sx={{
            mt: 2,
            alignItems: 'center',
            flexDirection: { xs: 'column-reverse', md: 'row' },
          }}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <ChildDashboardCard
              card={childsDashboardData.card}
              pageTheme={pageTheme}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h1" component="h2">
              {childsDashboardData.title}{' '}
            </Typography>
            <List>
              {childsDashboardData.features.map((feature) => (
                <HomeFeature key={feature} feature={feature} />
              ))}
            </List>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
