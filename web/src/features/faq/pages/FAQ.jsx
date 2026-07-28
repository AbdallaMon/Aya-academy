// FAQ — answers the parent's common objections in one place, right after pricing
// and just before the closing CTA, to remove friction before they decide.
// Content lives in ./faqData.js (shared with the homepage FAQPage JSON-LD so the
// structured data always matches what the user sees). Native details/summary
// keeps the accordion accessible and interactive without client JavaScript.

import { Box, Stack, Typography } from '@mui/material';
import { MdExpandMore } from 'react-icons/md';
import Section from '@/shared/ui/sections/Section.jsx';
import { getFaq } from '../faqData.js';

export default function FAQ({ lng = 'en' }) {
  const c = getFaq(lng);

  return (
    <Section
      id="faq"
      maxWidth="md"
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
    >
      <Stack spacing={1.5}>
        {c.items.map((item, i) => (
          <Box
            component="details"
            key={item.q}
            open={i === 0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              overflow: 'hidden',
              '&[open] [data-faq-icon]': { transform: 'rotate(180deg)' },
            }}
          >
            <Box
              component="summary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                px: { xs: 2, md: 3 },
                py: { xs: 2, md: 2.5 },
                cursor: 'pointer',
                listStyle: 'none',
                '&::-webkit-details-marker': { display: 'none' },
                '&:focus-visible': {
                  outline: '3px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: -3,
                },
              }}
            >
              <Typography
                variant="h6"
                component="h3"
                fontWeight={800}
                sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}
              >
                {item.q}
              </Typography>
              <Box
                data-faq-icon
                component="span"
                sx={{ display: 'inline-flex', flexShrink: 0, color: 'primary.main', transition: 'transform .2s ease' }}
              >
                <MdExpandMore size={24} />
              </Box>
            </Box>
            <Box sx={{ px: { xs: 2, md: 3 }, pb: 2.5, pt: 0 }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.9 }}
              >
                {item.a}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Section>
  );
}
