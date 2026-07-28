'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
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
import {
  reviewScreenshots,
  REVIEWS_PREVIEW_COUNT,
} from '../reviewScreenshots.js';

function ReviewTile({ shot, label, badge, onOpen }) {
  return (
    <Box
      component="button"
      type="button"
      sx={{
        display: 'block',
        width: '100%',
        minHeight: 48,
        p: 0,
        breakInside: 'avoid',
        mb: { xs: 1.5, md: 2 },
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'zoom-in',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'inherit',
        appearance: 'none',
        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: (th) => alpha(th.palette.primary.main, 0.5),
          boxShadow: (th) => `0 16px 36px ${alpha(th.palette.primary.main, 0.16)}`,
        },
        '&:hover [data-review-badge]': { opacity: 1 },
      }}
      onClick={onOpen}
      aria-label={label}
    >
      <Box sx={{ position: 'relative', lineHeight: 0 }}>
        <Image
          src={shot.src}
          alt={label}
          width={shot.width}
          height={shot.height}
          sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 900px) 45vw, 30vw"
          loading="lazy"
          decoding="async"
          style={{ display: 'block', width: '100%', height: 'auto' }}
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

function Lightbox({ shots, index, labels, onClose, onPrev, onNext }) {
  const open = index !== null;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') onPrev();
      else if (event.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;
  const shot = shots[index];
  const navButtonSx = {
    color: '#fff',
    bgcolor: alpha('#000', 0.35),
    '&:hover': { bgcolor: alpha('#000', 0.6) },
  };

  return (
    <Backdrop
      open
      onClick={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1, bgcolor: alpha('#000', 0.88) }}
    >
      <IconButton
        aria-label={labels.close}
        onClick={onClose}
        sx={{ position: 'absolute', top: 16, insetInlineEnd: 16, ...navButtonSx }}
      >
        <FaTimes />
      </IconButton>
      <IconButton
        aria-label={labels.prev}
        onClick={(event) => {
          event.stopPropagation();
          onPrev();
        }}
        sx={{ position: 'absolute', insetInlineStart: { xs: 8, md: 24 }, ...navButtonSx }}
      >
        <FaChevronRight />
      </IconButton>
      <Box
        onClick={(event) => event.stopPropagation()}
        sx={{
          lineHeight: 0,
          '& img': {
            maxWidth: { xs: '90vw', md: '80vw' },
            maxHeight: '88vh',
            borderRadius: 2,
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          },
        }}
      >
        <Image
          src={shot.src}
          alt={shot.alt[labels.language]}
          width={shot.width}
          height={shot.height}
          sizes="90vw"
          style={{ width: 'auto', height: 'auto' }}
        />
      </Box>
      <IconButton
        aria-label={labels.next}
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
        sx={{ position: 'absolute', insetInlineEnd: { xs: 8, md: 24 }, ...navButtonSx }}
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

export default function ReviewsGallery({ lng = 'en', labels }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const visible = expanded
    ? reviewScreenshots
    : reviewScreenshots.slice(0, REVIEWS_PREVIEW_COUNT);
  const hasMore = reviewScreenshots.length > REVIEWS_PREVIEW_COUNT;

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const previous = useCallback(
    () => setLightbox((index) => (
      index === null ? index : (index - 1 + reviewScreenshots.length) % reviewScreenshots.length
    )),
    [],
  );
  const next = useCallback(
    () => setLightbox((index) => (
      index === null ? index : (index + 1) % reviewScreenshots.length
    )),
    [],
  );

  return (
    <>
      <Box
        sx={{
          columnCount: { xs: 1, sm: 2, md: 3 },
          columnGap: { xs: 12, md: 16 },
        }}
      >
        {visible.map((shot, index) => (
          <ReviewTile
            key={shot.src}
            shot={shot}
            label={shot.alt[language]}
            badge={labels.badge}
            onOpen={() => setLightbox(index)}
          />
        ))}
      </Box>

      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: { xs: 3, md: 4 } }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setExpanded((value) => !value)}
            sx={{ borderRadius: 999, px: 4, fontWeight: 800 }}
          >
            {expanded ? labels.showLess : `${labels.showAll} (${reviewScreenshots.length})`}
          </Button>
        </Box>
      )}

      <Lightbox
        shots={reviewScreenshots}
        index={lightbox}
        labels={{
          language,
          close: labels.close,
          prev: labels.prev,
          next: labels.next,
        }}
        onClose={closeLightbox}
        onPrev={previous}
        onNext={next}
      />
    </>
  );
}
