import { Box, Container, Typography } from '@mui/material';

// Server-safe marketing section used by pages whose content does not need
// client state. The existing Section component stays client-side for the
// interactive homepage sections that still depend on the live theme.
export default function MarketingSection({
  id,
  eyebrow,
  title,
  titleComponent = 'h2',
  subtitle,
  children,
  maxWidth = 'lg',
  alt = false,
}) {
  return (
    <Box
      id={id}
      component="section"
      sx={{
        py: { xs: 7, md: 11 },
        bgcolor: alt ? 'background.paper' : 'background.default',
        ...(alt && { borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }),
      }}
    >
      <Container maxWidth={maxWidth}>
        {(eyebrow || title || subtitle) && (
          <Box sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto', mb: { xs: 4, md: 6 } }}>
            {eyebrow && (
              <Typography component="p" sx={{ color: 'brandText', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 13, mb: 1.5 }}>
                {eyebrow}
              </Typography>
            )}
            {title && <Typography component={titleComponent} variant="h2" sx={{ mb: subtitle ? 1.5 : 0 }}>{title}</Typography>}
            {subtitle && <Typography component="p" variant="h6" sx={{ fontWeight: 400, color: 'text.secondary', lineHeight: 1.7 }}>{subtitle}</Typography>}
          </Box>
        )}
        {children}
      </Container>
    </Box>
  );
}
