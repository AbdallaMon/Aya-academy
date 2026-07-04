'use client';

// Proof section — social proof in ONE place: the real student video
// (public/videos/review.mp4) on top, then a wall of REAL parent reviews shown as
// unedited WhatsApp screenshots (public/reviews/*.jpeg). No fabricated quote cards.
//   • Reviews are a CSS-columns masonry (the screenshots vary in aspect ratio).
//   • A "show all" toggle keeps the section lean; click any shot to zoom (lightbox).
// Edit the list in ./reviewScreenshots.js — captions for the video in ./reviewVideoData.js.

import { useCallback, useEffect, useState } from 'react';
import {
  Backdrop,
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaWhatsapp,
} from 'react-icons/fa';
import Section from '@/shared/ui/sections/Section.jsx';
import { useTranslation } from '@/i18n/client.js';
import { reviewVideo } from './reviewVideoData.js';
import {
  reviewScreenshots,
  REVIEWS_PREVIEW_COUNT,
} from './reviewScreenshots.js';

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

// ── A single screenshot tile in the masonry wall ────────────────────────────
function ReviewTile({ shot, label, badge, onOpen }) {
  return (
    <Box
      sx={{
        breakInside: 'avoid',
        mb: { xs: 1.5, md: 2 },
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'zoom-in',
        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: (th) => alpha(th.palette.primary.main, 0.5),
          boxShadow: (th) => `0 16px 36px ${alpha(th.palette.primary.main, 0.16)}`,
        },
        '&:hover [data-review-badge]': { opacity: 1 },
      }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <Box sx={{ position: 'relative', lineHeight: 0 }}>
        <Box
          component="img"
          src={shot.src}
          alt={label}
          loading="lazy"
          decoding="async"
          sx={{ display: 'block', width: '100%', height: 'auto' }}
        />
        <Stack
          data-review-badge
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            position: 'absolute',
            insetInlineStart: 8,
            top: 8,
            px: 1,
            py: 0.5,
            borderRadius: 999,
            bgcolor: alpha('#0a0a0a', 0.55),
            color: '#fff',
            backdropFilter: 'blur(4px)',
            opacity: { xs: 1, md: 0 },
            transition: 'opacity .2s ease',
            pointerEvents: 'none',
          }}
        >
          <FaWhatsapp size={13} color="#25D366" aria-hidden />
          <Typography variant="caption" fontWeight={700} sx={{ color: '#fff' }}>
            {badge}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

// ── Fullscreen lightbox with keyboard + prev/next ───────────────────────────
function Lightbox({ shots, index, label, onClose, onPrev, onNext }) {
  const open = index !== null;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;
  const shot = shots[index];

  const navBtn = {
    color: '#fff',
    bgcolor: alpha('#000', 0.35),
    '&:hover': { bgcolor: alpha('#000', 0.6) },
  };

  return (
    <Backdrop
      open
      onClick={onClose}
      sx={{ zIndex: (th) => th.zIndex.modal + 1, bgcolor: alpha('#000', 0.88) }}
    >
      <IconButton
        aria-label={label.close}
        onClick={onClose}
        sx={{ position: 'absolute', top: 16, insetInlineEnd: 16, ...navBtn }}
      >
        <FaTimes />
      </IconButton>

      <IconButton
        aria-label={label.prev}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        sx={{ position: 'absolute', insetInlineStart: { xs: 8, md: 24 }, ...navBtn }}
      >
        <FaChevronRight />
      </IconButton>

      <Box
        component="img"
        src={shot.src}
        alt={label.alt}
        onClick={(e) => e.stopPropagation()}
        sx={{
          maxWidth: { xs: '90vw', md: '80vw' },
          maxHeight: '88vh',
          width: 'auto',
          height: 'auto',
          borderRadius: 2,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      />

      <IconButton
        aria-label={label.next}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        sx={{ position: 'absolute', insetInlineEnd: { xs: 8, md: 24 }, ...navBtn }}
      >
        <FaChevronLeft />
      </IconButton>

      <Typography
        sx={{
          position: 'absolute',
          bottom: 20,
          color: alpha('#fff', 0.7),
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {index + 1} / {shots.length}
      </Typography>
    </Backdrop>
  );
}

export default function Testimonials() {
  const { lng } = useTranslation();
  const L = lng === 'en' ? 'en' : 'ar';
  const h = PROOF_HEADING[L];

  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const visible = expanded
    ? reviewScreenshots
    : reviewScreenshots.slice(0, REVIEWS_PREVIEW_COUNT);
  const hasMore = reviewScreenshots.length > REVIEWS_PREVIEW_COUNT;

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prev = useCallback(
    () =>
      setLightbox((i) =>
        i === null ? i : (i - 1 + reviewScreenshots.length) % reviewScreenshots.length
      ),
    []
  );
  const next = useCallback(
    () =>
      setLightbox((i) =>
        i === null ? i : (i + 1) % reviewScreenshots.length
      ),
    []
  );

  return (
    <Section id="proof" eyebrow={h.eyebrow} title={h.title} subtitle={h.subtitle}>
      {/* ── Real student video in a phone frame ──────────────────────────── */}
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
            boxShadow: (th) => `0 28px 60px ${alpha(th.palette.primary.main, 0.22)}`,
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
          </Box>
        </Box>
        <Typography variant="body2" fontWeight={700} sx={{ mt: 1.5, textAlign: 'center' }}>
          {h.videoIntro}
        </Typography>
      </Box>

      {/* ── Wall of real WhatsApp review screenshots (masonry) ───────────── */}
      <Box
        sx={{
          columnCount: { xs: 1, sm: 2, md: 3 },
          columnGap: { xs: 12, md: 16 },
        }}
      >
        {visible.map((shot, i) => (
          <ReviewTile
            key={shot.src}
            shot={shot}
            label={shot.alt[L]}
            badge={h.badge}
            onOpen={() => setLightbox(i)}
          />
        ))}
      </Box>

      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: { xs: 3, md: 4 } }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setExpanded((v) => !v)}
            sx={{ borderRadius: 999, px: 4, fontWeight: 800 }}
          >
            {expanded ? h.showLess : `${h.showAll} (${reviewScreenshots.length})`}
          </Button>
        </Box>
      )}

      <Lightbox
        shots={reviewScreenshots}
        index={lightbox}
        label={{
          close: h.close,
          prev: h.prev,
          next: h.next,
          alt: lightbox !== null ? reviewScreenshots[lightbox].alt[L] : '',
        }}
        onClose={closeLightbox}
        onPrev={prev}
        onNext={next}
      />
    </Section>
  );
}
