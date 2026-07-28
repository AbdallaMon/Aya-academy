// Proof section shell. The heading, video frame and copy render on the server;
// only video proximity detection and the review lightbox are client islands.

import { Box, Typography } from '@mui/material';
import Section from '@/shared/ui/sections/Section.jsx';
import { reviewVideo } from '../reviewVideoData.js';
import LazyReviewVideo from '../components/LazyReviewVideo.jsx';
import ReviewsGallery from '../components/ReviewsGallery.jsx';

const PROOF_HEADING = {
  ar: {
    eyebrow: 'رسائل حقيقية من أولياء الأمور',
    title: 'كلماتٌ من قلوب الأهل',
    subtitle:
      'لقطات حقيقية من محادثاتنا مع أولياء الأمور حول العالم — بلا تعديل ولا تجميل.',
    videoIntro: 'شاهد طالبة حقيقية تتلو القرآن.',
    showAll: 'عرض كل التقييمات',
    showLess: 'عرض أقل',
    badge: 'رسالة من ولي أمر',
    close: 'إغلاق',
    prev: 'السابق',
    next: 'التالي',
  },
  en: {
    eyebrow: 'Real messages from parents',
    title: 'Words straight from parents’ hearts',
    subtitle:
      'Genuine screenshots from our chats with parents around the world — unedited.',
    videoIntro: 'Watch a real student recite the Quran.',
    showAll: 'Show all reviews',
    showLess: 'Show less',
    badge: 'Message from a parent',
    close: 'Close',
    prev: 'Previous',
    next: 'Next',
  },
};

export default function Testimonials({ lng = 'en' }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const heading = PROOF_HEADING[language];

  return (
    <Section
      id="proof"
      eyebrow={heading.eyebrow}
      title={heading.title}
      subtitle={heading.subtitle}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 5, md: 7 } }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 290,
            p: 1,
            borderRadius: 6,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 28px 60px rgba(26, 188, 156, 0.22)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: -24,
              zIndex: -1,
              borderRadius: '50%',
              background:
                'radial-gradient(60% 60% at 50% 40%, rgba(246, 196, 83, 0.28), transparent 70%)',
            },
          }}
        >
          <LazyReviewVideo
            src={reviewVideo.src}
            poster={reviewVideo.poster}
            label={heading.videoIntro}
          />
        </Box>
        <Typography variant="body2" fontWeight={700} sx={{ mt: 1.5, textAlign: 'center' }}>
          {heading.videoIntro}
        </Typography>
      </Box>

      <ReviewsGallery lng={language} labels={heading} />
    </Section>
  );
}
