'use client';

// FAQ — answers the parent's common objections in one place, right before the
// pricing section, to remove friction before they decide. Content is fully
// editable in CONTENT below — keep answers honest and update them to match your
// real policy (session length, cancellation, etc.).

import { Box, Container, Stack, Typography } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { MdExpandMore } from 'react-icons/md';
import { sectionYPadding } from '@/shared/utlis/constants';
import { useTranslation } from '@/i18n/client.js';

const CONTENT = {
  ar: {
    eyebrow: 'الأسئلة الشائعة',
    title: 'كل ما يهم ولي الأمر',
    subtitle: 'إجابات سريعة عن أكثر ما يسأل عنه الأهل قبل البدء.',
    items: [
      {
        q: 'ما هي الأعمار المناسبة؟',
        a: 'أكاديمية آية مصمّمة للأطفال من ٥ إلى ١٤ سنة، مع مستويات مرتّبة حسب العمر والخبرة ليتقدّم كل طفل بإيقاع مناسب له.',
      },
      {
        q: 'هل الحصص مباشرة أم مسجّلة؟',
        a: 'الاثنان معًا: جلسات مباشرة مع معلّم، بالإضافة إلى دروس قصيرة موجّهة يمكن للطفل متابعتها في أي وقت.',
      },
      {
        q: 'هل أحتاج بطاقة دفع لتجربة الأكاديمية؟',
        a: 'لا. الحصة التجريبية مجانية تمامًا وبدون بطاقة دفع وبدون أي التزام — جرّب أولًا ثم قرّر.',
      },
      {
        q: 'كيف أتابع تقدّم طفلي؟',
        a: 'من خلال لوحة ولي الأمر ثنائية اللغة التي تعرض التقدّم في كل جزء ومستوى، مع الأوسمة وأيام المواظبة.',
      },
      {
        q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟',
        a: 'نعم، يمكنك الإلغاء في أي وقت بسهولة ودون أي تعقيد.',
      },
      {
        q: 'بأي لغة يتم الشرح؟',
        a: 'الشرح ثنائي اللغة بالعربية والإنجليزية، ليفهم كل طفل ويشارك ولي الأمر بسهولة.',
      },
    ],
  },
  en: {
    eyebrow: 'FAQ',
    title: 'Everything parents ask',
    subtitle: 'Quick answers to what parents ask most before starting.',
    items: [
      {
        q: 'What ages is it for?',
        a: 'Aya Academy is built for kids aged 5–14, with levels organized by age and experience so every child progresses at their own pace.',
      },
      {
        q: 'Are lessons live or recorded?',
        a: 'Both: live sessions with a teacher, plus short guided video lessons your child can follow anytime.',
      },
      {
        q: 'Do I need a card to try it?',
        a: 'No. The trial session is completely free, with no card and no commitment — try first, then decide.',
      },
      {
        q: 'How do I track my child’s progress?',
        a: 'Through a bilingual parent dashboard that shows progress for each Juz and level, plus badges and streak days.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes, you can cancel anytime, easily and with no hassle.',
      },
      {
        q: 'What language is the teaching in?',
        a: 'Teaching is bilingual in Arabic and English, so every child understands and parents can follow along.',
      },
    ],
  },
};

export default function FAQ() {
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];

  return (
    <Box id="faq" component="section" sx={{ py: sectionYPadding, bgcolor: 'background.paper' }}>
      <Container maxWidth="md">
        <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            sx={{
              color: 'primary.main',
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              fontSize: 13,
            }}
          >
            {c.eyebrow}
          </Typography>
          <Typography variant="h2">{c.title}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, maxWidth: 560 }} color="text.secondary">
            {c.subtitle}
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {c.items.map((item, i) => (
            <Accordion
              key={i}
              disableGutters
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
                '&:before': { display: 'none' },
                overflow: 'hidden',
              }}
            >
              <AccordionSummary
                expandIcon={<MdExpandMore size={24} />}
                sx={{ px: { xs: 2, md: 3 }, py: 1, '& .MuiAccordionSummary-content': { my: 1.5 } }}
              >
                <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                  {item.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: 2.5, pt: 0 }}>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                  {item.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
