import { howItWorksData } from '@/shared/data/how-it-works';
import { Box, Container, Grid, Typography } from '@mui/material';
import { HowItWorkCard } from './components/HowItWorkCard';
import { PageTheme } from '@/shared/types/general';
import { sectionYPadding } from '@/shared/utlis/constants';

export default function HowItWorks({ pageTheme }: { pageTheme: PageTheme }) {
  return (
    <Box
      id="how-it-works"
      sx={{
        backgroundColor: 'background.paper',
        py: sectionYPadding,
        px: {
          xs: 2,
          md: 0,
        },
      }}
    >
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: 'center',
            textAlign: 'center',
            mb: 4,
          }}
        >
          <Typography variant="h2">{howItWorksData.title}</Typography>
          <Typography variant="h6" sx={{ maxWidth: 600 }}>
            {howItWorksData.description}
          </Typography>
        </Box>
        <Box>
          <Grid container spacing={2}>
            {howItWorksData.steps.map((step, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                <HowItWorkCard
                  step={step}
                  pageTheme={pageTheme}
                  index={index}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
