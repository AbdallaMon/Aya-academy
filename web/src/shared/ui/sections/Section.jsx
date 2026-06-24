'use client';

// Section — the shared rhythm primitive for the marketing homepage. Gives every
// section consistent vertical spacing, an optional centered heading block
// (eyebrow + title + subtitle), and a container. Colors come from the LIVE MUI
// theme (so light/dark toggling is instant) — never from a static pageTheme prop.

import { Box, Container, Typography } from '@mui/material';

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', sx }) {
  return (
    <Box
      sx={{
        textAlign: align,
        mx: align === 'center' ? 'auto' : 0,
        maxWidth: align === 'center' ? 740 : 'none',
        mb: { xs: 4, md: 6 },
        ...sx,
      }}
    >
      {eyebrow && (
        <Typography
          sx={{
            color: 'primary.main',
            fontWeight: 800,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            fontSize: 13,
            mb: 1.5,
          }}
        >
          {eyebrow}
        </Typography>
      )}
      {title && (
        <Typography variant="h2" sx={{ mb: subtitle ? 1.5 : 0 }}>
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="h6" sx={{ fontWeight: 400, color: 'text.secondary', lineHeight: 1.7 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  headingAlign = 'center',
  alt = false,
  maxWidth = 'lg',
  children,
  sx,
}) {
  return (
    <Box
      id={id}
      component="section"
      sx={{
        py: { xs: 7, md: 11 },
        bgcolor: alt ? 'background.paper' : 'background.default',
        scrollMarginTop: 90, // so anchored sections clear the sticky navbar
        ...sx,
      }}
    >
      <Container maxWidth={maxWidth}>
        {(eyebrow || title || subtitle) && (
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} align={headingAlign} />
        )}
        {children}
      </Container>
    </Box>
  );
}
