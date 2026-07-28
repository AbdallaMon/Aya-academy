'use client';

import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

// Keep the 8.5MB review video out of the initial network waterfall. The poster
// reserves the exact frame; the real <video> (and therefore its source request)
// is only mounted when the section is close to the viewport.
export default function LazyReviewVideo({ src, poster, label }) {
  const frameRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: '480px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={frameRef} sx={{ width: '100%', aspectRatio: '9 / 16', borderRadius: 5, overflow: 'hidden', bgcolor: '#000' }}>
      {isNearViewport ? (
        <Box
          component="video"
          controls
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={label}
          sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={src} type="video/mp4" />
        </Box>
      ) : (
        <Box
          component="img"
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          aria-hidden
          sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </Box>
  );
}
