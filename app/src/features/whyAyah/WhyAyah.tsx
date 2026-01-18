import { whyAyahData } from '@/shared/data/why-ayah';
import { PageTheme } from '@/shared/types/general';
import {
  getCurrentColorScheme,
  sectionYPadding,
} from '@/shared/utlis/constants';
import { Box, Container, Grid, lighten, Typography } from '@mui/material';

export function WhyAyah({ pageTheme }: { pageTheme: PageTheme }) {
  const colors = getCurrentColorScheme(pageTheme);
  return (
    <Box
      sx={{
        py: sectionYPadding,
        backgroundColor: colors.paperBackground,
      }}
    >
      <Container maxWidth="lg">
        <Box>
          <Typography
            variant="h1"
            component="h2"
            gutterBottom
            sx={{
              textAlign: 'center',
              mb: 6,
            }}
          >
            {whyAyahData.title}
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 4, md: 2 }} alignItems="center">
          {whyAyahData.reasons.map((reason, index) => {
            const Icon = reason.icon;
            const color =
              reason.color === 'primary'
                ? colors.primary
                : reason.color === 'secondary'
                  ? colors.accent
                  : reason.color === 'info'
                    ? colors.danger
                    : colors.warning;
            return (
              <Grid
                size={{ xs: 12, md: 3 }}
                key={index}
                sx={{
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: lighten(color, 0.85),
                      borderRadius: '50%',
                      width: 80,
                      color: color,
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={48} />
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{
                      mt: 2,
                      fontWeight: 'bold',
                    }}
                  >
                    {reason.title}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    component="p"
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    {reason.description}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
