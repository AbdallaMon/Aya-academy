import { Box, Button, Container, Divider, Typography } from '@mui/material';
import { MdOutlinePolicy } from 'react-icons/md';
import { localePath } from '@/i18n/routing.js';
import { getLegalContent } from '../data.js';

export default function LegalPage({ type, lng }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const content = getLegalContent(type, language);
  const relatedPath = type === 'privacy' ? '/terms' : '/privacy';

  return (
    <>
      <Box
        component="header"
        sx={{
          py: { xs: 7, md: 10 },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              width: 58,
              height: 58,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 3,
              color: 'primary.main',
              bgcolor: 'rgba(12, 124, 111, 0.08)',
              mb: 2.5,
            }}
          >
            <MdOutlinePolicy size={31} aria-hidden />
          </Box>
          <Typography
            component="p"
            sx={{
              color: 'brandText',
              fontWeight: 800,
              letterSpacing: 1.1,
              textTransform: 'uppercase',
              fontSize: 13,
              mb: 1.5,
            }}
          >
            {content.eyebrow}
          </Typography>
          <Typography component="h1" variant="h1" sx={{ mb: 1.5 }}>
            {content.title}
          </Typography>
          <Typography
            component="p"
            variant="body2"
            sx={{ color: 'text.secondary', fontWeight: 700, mb: 2 }}
          >
            {content.lastUpdated}
          </Typography>
          <Typography
            component="p"
            variant="h6"
            sx={{ color: 'text.secondary', fontWeight: 400, lineHeight: 1.9 }}
          >
            {content.intro}
          </Typography>
        </Container>
      </Box>

      <Container
        maxWidth="md"
        sx={{
          py: { xs: 6, md: 9 },
          '& section + section': {
            mt: { xs: 4, md: 5 },
            pt: { xs: 4, md: 5 },
            borderTop: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {content.sections.map((section) => (
          <Box component="section" key={section.title}>
            <Typography component="h2" variant="h4" sx={{ mb: 2, fontWeight: 800 }}>
              {section.title}
            </Typography>
            {section.paragraphs?.map((paragraph) => (
              <Typography
                component="p"
                key={paragraph}
                color="text.secondary"
                sx={{ lineHeight: 1.95, '& + &': { mt: 1.5 } }}
              >
                {paragraph}
              </Typography>
            ))}
            {section.bullets && (
              <Box
                component="ul"
                sx={{
                  mt: section.paragraphs ? 2 : 0,
                  mb: 0,
                  ps: 3,
                  color: 'text.secondary',
                  '& li + li': { mt: 1.2 },
                }}
              >
                {section.bullets.map((item) => (
                  <Box component="li" key={item}>
                    <Typography component="span" sx={{ lineHeight: 1.9 }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}

        <Divider sx={{ my: { xs: 5, md: 7 } }} />

        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography component="h2" variant="h4" sx={{ mb: 1.5 }}>
            {content.contactTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
            {content.contactBody}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
            <Button
              component="a"
              href={localePath(language, '/contact')}
              variant="contained"
            >
              {content.contactAction}
            </Button>
            <Button
              component="a"
              href={localePath(language, relatedPath)}
              variant="outlined"
            >
              {content.relatedLabel}
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
}
