'use client';

// A single blog post card — used in the list grid and the "related" section.
// The cover is generated from theme tokens (emoji + accent gradient) so we ship
// zero raster images and stay crisp in light/dark + RTL.

import Link from 'next/link';
import { Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MdAccessTime } from 'react-icons/md';
import { localePath } from '@/i18n/routing.js';
import { pick, formatDate, readingLabel } from '../lib/helpers';

// Resolve an article's accent to a real palette color (falls back to primary).
function accentColor(theme, accent) {
  return (theme.palette[accent] && theme.palette[accent].main) || theme.palette.primary.main;
}

export function ArticleCover({ emoji, accent, height = 150 }) {
  const theme = useTheme();
  const c = accentColor(theme, accent);
  return (
    <Box
      aria-hidden
      sx={{
        height,
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(c, 0.9)}, ${alpha(theme.palette.secondary.main, 0.85)})`,
      }}
    >
      {/* soft decorative blobs */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(40% 60% at 80% 20%, ${alpha('#fff', 0.25)}, transparent 70%), radial-gradient(40% 60% at 15% 90%, ${alpha('#fff', 0.18)}, transparent 70%)`,
        }}
      />
      <Box sx={{ fontSize: 56, lineHeight: 1, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}>
        {emoji}
      </Box>
    </Box>
  );
}

export default function ArticleCard({ article, lng, categoryLabel }) {
  const theme = useTheme();
  const href = localePath(lng, `/blog/${article.slug}`);

  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textDecoration: 'none',
        borderRadius: 5,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          borderColor: alpha(theme.palette.primary.main, 0.4),
          boxShadow: `0 22px 48px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.4 : 0.18)}`,
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <ArticleCover emoji={article.emoji} accent={article.accent} />
        {categoryLabel && (
          <Chip
            label={categoryLabel}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              insetInlineStart: 12,
              fontWeight: 800,
              bgcolor: 'background.paper',
              color: 'text.primary',
            }}
          />
        )}
      </Box>

      <Box sx={{ p: { xs: 2.25, md: 2.75 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1, color: 'text.secondary' }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {formatDate(article.datePublished, lng)}
          </Typography>
          <Box component="span" sx={{ opacity: 0.5 }}>·</Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <MdAccessTime size={14} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {readingLabel(article.readingTime, lng)}
            </Typography>
          </Stack>
        </Stack>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            lineHeight: 1.4,
            mb: 1,
            color: 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {pick(article.title, lng)}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            lineHeight: 1.8,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {pick(article.description, lng)}
        </Typography>

        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 'auto' }}>
          {(article.tags || []).map((tag) => (
            <Chip
              key={tag.en}
              label={pick(tag, lng)}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 700, height: 26 }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
