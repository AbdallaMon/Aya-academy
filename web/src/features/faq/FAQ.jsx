'use client';

// FAQ — answers the parent's common objections in one place, right after pricing
// and just before the closing CTA, to remove friction before they decide.
// Content lives in ./faqData.js (shared with the homepage FAQPage JSON-LD so the
// structured data always matches what the user sees). Keep answers honest.

import { Stack, Typography } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { MdExpandMore } from 'react-icons/md';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';
import { getFaq } from './faqData.js';

export default function FAQ() {
  const { lng } = useTranslation();
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
          <Accordion
            key={i}
            defaultExpanded={i === 0}
            disableGutters
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<MdExpandMore size={24} />}
              sx={{
                px: { xs: 2, md: 3 },
                py: 1,
                '& .MuiAccordionSummary-content': { my: 1.5 },
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
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: 2.5, pt: 0 }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.9 }}
              >
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Section>
  );
}
