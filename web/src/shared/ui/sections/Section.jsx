'use client';

// Section — the shared rhythm primitive for the marketing homepage. Gives every
// section consistent vertical spacing, an optional centered heading block
// (eyebrow + title + subtitle), and a container. Colors come from the LIVE MUI
// theme (so light/dark toggling is instant) — never from a static pageTheme prop.

import { Box, Container, Typography } from '@mui/material';
import Eyebrow from '@/shared/ui/Eyebrow.jsx';

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
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
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
        // The two surface tokens differ by only ~1.05:1, so `alt` alone is nearly
        // invisible. A hairline top+bottom seam makes alternating sections read as
        // distinct bands without darkening the shared card surface.
        ...(alt && {
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }),
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
