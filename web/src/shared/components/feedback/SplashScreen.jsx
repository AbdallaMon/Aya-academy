'use client';

// SplashScreen — a branded full-screen loading overlay shown until the page has
// opened. It is rendered in the marketing layout so it appears immediately in the
// SSR HTML, then fades out once the window finishes loading (with a safety
// fallback so it can never get stuck). Colours come from the live MUI theme.

import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function SplashScreen() {
  const [fading, setFading] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    let fallback;
    const finish = () => setFading(true);
    if (document.readyState === 'complete') {
      fallback = setTimeout(finish, 400); // already loaded — brief, so the fade reads
    } else {
      window.addEventListener('load', finish);
      fallback = setTimeout(finish, 2500); // never let the splash stick
    }
    return () => {
      window.removeEventListener('load', finish);
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!fading) return undefined;
    const t = setTimeout(() => setRemoved(true), 550); // unmount after the fade
    return () => clearTimeout(t);
  }, [fading]);

  if (removed) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (t) => t.zIndex.modal + 100,
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
        opacity: fading ? 0 : 1,
        visibility: fading ? 'hidden' : 'visible',
        transition: 'opacity .5s ease, visibility .5s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        <CircularProgress
          size={120}
          thickness={2}
          sx={{ position: 'absolute', color: 'primary.main', opacity: 0.3 }}
        />
        <Box
          component="img"
          src="/logos/logo.png"
          alt="Aya Academy"
          sx={{
            width: 88,
            height: 88,
            objectFit: 'contain',
            animation: 'ayaPulse 1.4s ease-in-out infinite',
          }}
        />
      </Box>
    </Box>
  );
}
