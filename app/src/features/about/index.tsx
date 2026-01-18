import { aboutData } from '@/shared/data/about';
import { PageTheme } from '@/shared/types/general';
import { sectionYPadding } from '@/shared/utlis/constants';
import {
  Box,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';

export function About({ pageTheme }: { pageTheme: PageTheme }) {
  return (
    <Box
      id="about"
      sx={{
        py: sectionYPadding,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 3 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h1" component="h2" gutterBottom>
              {aboutData.title}
            </Typography>
            <Typography
              variant="h4"
              component="h3"
              color="primary.main"
              gutterBottom
              sx={{
                mt: 2,
                mb: 3,
              }}
            >
              {aboutData.slogan}
            </Typography>
            <List>
              {aboutData.descriptionList.map((desc, index) => (
                <ListItem key={index} disablePadding>
                  <Typography
                    variant="h5"
                    component={ListItemText}
                    primary={desc}
                    gutterBottom
                  />
                </ListItem>
              ))}
            </List>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 1, md: 2 },
                mt: 2,
              }}
            >
              {aboutData.keyFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1,
                      py: 1.5,
                      border: `1px solid`,
                      borderRadius: 10,
                      color: feature.color,
                    }}
                  >
                    <Box
                      sx={{
                        display: { xs: 'block', md: 'none' },
                      }}
                    >
                      <IconComponent size={16} />
                    </Box>
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'block' },
                      }}
                    >
                      <IconComponent size={24} />
                    </Box>

                    <Typography variant="body1">{feature.title}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src={aboutData.image}
              alt="About Ayah"
              sx={{
                width: '100%',
                borderRadius: 2,
                // boxShadow: 3,
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
