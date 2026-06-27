'use client';

// Proof section — the real student video (public/videos/review.mp4) shown next to
// a few parent reviews, so social proof lives in ONE place instead of a standalone
// video section + a separate 6-card grid. No on-page transcript: the video carries
// captions (CC). Parent reviews are editable in ./testimonialsData.js.

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FaQuoteRight, FaStar } from 'react-icons/fa';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';
import { testimonials } from './testimonialsData.js';
import { reviewVideo } from './reviewVideoData.js';

// The three strongest, distinct reviews to keep the section lean.
const FEATURED_IDS = ['sara-uk', 'mohamed-us', 'layla-uk'];

const PROOF_HEADING = {
  ar: {
    eyebrow: 'طلاب وأهالٍ حقيقيون',
    title: 'شاهد واسمع لماذا تحب الأسر آية',
    subtitle: 'فيديو حقيقي لطالبة، وآراء صادقة من أولياء الأمور.',
    videoIntro: 'شاهد طالبة حقيقية تتلو القرآن.',
  },
  en: {
    eyebrow: 'Real students & parents',
    title: 'See and hear why families love Aya',
    subtitle: 'A real student video, and honest words from parents.',
    videoIntro: 'Watch a real student recite the Quran.',
  },
};

function Stars({ count = 5, label }) {
  return (
    <Stack
      direction="row"
      spacing={0.25}
      sx={{ color: '#FFC107' }}
      role="img"
      aria-label={label || `${count}/5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} size={15} aria-hidden style={{ opacity: i < count ? 1 : 0.25 }} />
      ))}
    </Stack>
  );
}

export default function Testimonials() {
  const { lng } = useTranslation();
  const L = lng === 'en' ? 'en' : 'ar';
  const h = PROOF_HEADING[L];
  const cards = FEATURED_IDS.map((id) =>
    testimonials.find((t) => t.id === id)
  ).filter(Boolean);

  return (
    <Section
      id="proof"
      eyebrow={h.eyebrow}
      title={h.title}
      subtitle={h.subtitle}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(260px, 0.75fr) 1.25fr',
          },
          gap: { xs: 4, md: 5 },
          alignItems: 'center',
        }}
      >
        {/* ── Real student video in a phone frame ──────────────────── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 300,
              p: 1,
              borderRadius: 6,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: (th) =>
                `0 28px 60px ${alpha(th.palette.primary.main, 0.22)}`,
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: -24,
                zIndex: -1,
                borderRadius: '50%',
                background: (th) =>
                  `radial-gradient(60% 60% at 50% 40%, ${alpha(th.palette.secondary.main, 0.28)}, transparent 70%)`,
              },
            }}
          >
            <Box
              component="video"
              controls
              playsInline
              preload="metadata"
              poster={reviewVideo.poster}
              sx={{
                display: 'block',
                width: '100%',
                aspectRatio: '9 / 16',
                borderRadius: 5,
                bgcolor: '#000',
                objectFit: 'cover',
              }}
            >
              <source src={reviewVideo.src} type="video/mp4" />
              <track
                kind="captions"
                src={reviewVideo.captions}
                srcLang="ar"
                label="العربية / English"
                default
              />
            </Box>
          </Box>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ mt: 1.5, textAlign: 'center' }}
          >
            {h.videoIntro}
          </Typography>
        </Box>

        {/* ── 3 parent reviews ─────────────────────────────────────── */}
        <Stack spacing={2}>
          {cards.map((item) => (
            <Card
              key={item.id}
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                transition:
                  'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: (th) => alpha(th.palette.primary.main, 0.5),
                  boxShadow: (th) =>
                    `0 16px 36px ${alpha(th.palette.primary.main, 0.14)}`,
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.25 }}
                >
                  <Stars
                    count={item.rating}
                    label={
                      L === 'en'
                        ? `${item.rating} out of 5 stars`
                        : `${item.rating} من 5 نجوم`
                    }
                  />
                  <Box
                    sx={{ color: (th) => alpha(th.palette.primary.main, 0.35) }}
                  >
                    <FaQuoteRight size={20} aria-hidden />
                  </Box>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{ color: 'text.primary', lineHeight: 1.8, mb: 2 }}
                >
                  {item.quote[L]}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    src={item.avatar || undefined}
                    alt={item.name[L]}
                    sx={{
                      bgcolor: (th) => alpha(th.palette.primary.main, 0.15),
                      color: 'primary.main',
                      fontWeight: 800,
                    }}
                  >
                    {item.name[L]?.charAt(0)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={800} noWrap>
                      {item.name[L]} {item.country}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.role[L]}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Section>
  );
}
