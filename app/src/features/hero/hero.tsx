import {
  heroActionData,
  heroImagesData,
  heroTextData,
} from "@/shared/data/hero";
import { PageTheme } from "@/shared/types/general";
import { Box, Button, Container, Grid, Typography } from "@mui/material";

export default function Hero({
  pageTheme = "light",
}: {
  pageTheme: PageTheme;
}) {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        // background: `linear-gradient(to bottom, ${colors.paperBackground} 0%, ${colors.background} 40%, ${colors.lightPrimary} 100%)`,
        position: "relative",
      }}
    >
      <Box
        component="img"
        src={heroImagesData.background.src[pageTheme]}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          objectFit: "cover",
          opacity: 1,
        }}
      />
      <Container maxWidth="lg">
        <Grid
          container
          spacing={4}
          sx={{
            alignItems: "center",
            position: "relative",
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
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "text.secondary",
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

function HeroText() {
  return (
    <Box>
      <Typography
        variant="h6"
        color="success.main"
        sx={{
          fontWeight: 400,
          fontSize: {
            xs: "13px",
            md: "15px",
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
function HeroActions() {
  const JourneyIcon = heroActionData.journey.icon;
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flexDirection: { xs: "column", sm: "row" },
        mt: 4,
      }}
    >
      <Button
        variant="contained"
        href={heroActionData.journey.href}
        size="large"
        // startIcon={}
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
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
          display: "flex",
          gap: 1,
          alignItems: "center",
          backgroundColor: "background.white",
        }}
      >
        {heroActionData.booking.text}
      </Button>
    </Box>
  );
}

function HeroImage({ pageTheme }: { pageTheme: PageTheme }) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Box
        component="img"
        src={heroImagesData.main.src[pageTheme]}
        alt={heroImagesData.main.alt}
        sx={{
          maxWidth: "100%",
          maxHeight: { xs: 300, md: 600 },
          height: "auto",
        }}
      />
    </Box>
  );
}
