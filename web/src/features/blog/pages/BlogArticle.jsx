'use client';

// Single-article view. Looks the article up from the data file by slug (the
// server page already guarantees it exists via getArticle/notFound), then
// renders a themed hero, the structured body, related posts and a CTA.

import Link from 'next/link';
import { Box, Button, Chip, Container, Link as MuiLink, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MdArrowBack, MdArrowForward, MdAccessTime, MdLibraryBooks, MdOpenInNew } from 'react-icons/md';
import { useTranslation } from '@/i18n/client.js';
import { localePath } from '@/i18n/routing.js';
import { getArticle, blogCategories } from '../data/articles';
import { pickBlogUi } from '../data/ui';
import { pick, formatDate, readingLabel } from '../lib/helpers';
import ArticleBody from '../components/ArticleBody';
import ArticleCard from '../components/ArticleCard';

function accentColor(theme, accent) {
  return (theme.palette[accent] && theme.palette[accent].main) || theme.palette.primary.main;
}

export default function BlogArticle({ slug }) {
  const { lng } = useTranslation();
  const theme = useTheme();
  const ui = pickBlogUi(lng);

  const article = getArticle(slug);
  if (!article) return null;

  const BackIcon = lng === 'ar' ? MdArrowForward : MdArrowBack;
  const accent = accentColor(theme, article.accent);
  const related = (article.related || []).map(getArticle).filter(Boolean);
  const catKey = (article.categories || [])[0];
  const catLabel = catKey && blogCategories[catKey] ? pick(blogCategories[catKey], lng) : null;

  return (
    <Box>
      {/* Hero header */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 5, md: 7 },
          pb: { xs: 6, md: 8 },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(45% 60% at 50% 0%, ${alpha(accent, 0.18)}, transparent 70%)`,
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Button
            component={Link}
            href={localePath(lng, '/blog')}
            startIcon={<BackIcon />}
            size="small"
            sx={{ mb: 3, fontWeight: 800, color: 'text.secondary' }}
          >
            {ui.backToList}
          </Button>

          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
            <Box
              sx={{
                width: { xs: 64, md: 80 },
                height: { xs: 64, md: 80 },
                borderRadius: 4,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                fontSize: { xs: 34, md: 42 },
                background: `linear-gradient(135deg, ${alpha(accent, 0.9)}, ${alpha(theme.palette.secondary.main, 0.85)})`,
                boxShadow: `0 12px 28px ${alpha(accent, 0.35)}`,
              }}
            >
              {article.emoji}
            </Box>
            {catLabel && <Chip label={catLabel} color="primary" sx={{ fontWeight: 800 }} />}
          </Stack>

          <Typography variant="h3" component="h1" sx={{ fontWeight: 900, lineHeight: 1.3, mb: 2 }}>
            {pick(article.title, lng)}
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 400, color: 'text.secondary', lineHeight: 1.8, mb: 2.5 }}>
            {pick(article.description, lng)}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'text.secondary' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatDate(article.datePublished, lng)}
            </Typography>
            <Box component="span" sx={{ opacity: 0.5 }}>·</Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdAccessTime size={16} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {readingLabel(article.readingTime, lng)}
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Body */}
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 7 } }}>
        <ArticleBody body={article.body} lng={lng} />

        {(article.tags || []).length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 4 }}>
            {article.tags.map((tag) => (
              <Chip key={tag.en} label={pick(tag, lng)} variant="outlined" sx={{ fontWeight: 700 }} />
            ))}
          </Stack>
        )}

        {/* Sources — transparent attribution for every ayah/hadith used. */}
        {(article.sources || []).length > 0 && (
          <Box
            sx={{
              mt: 5,
              p: { xs: 2.5, md: 3 },
              borderRadius: 4,
              bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.06 : 0.03),
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, color: 'text.primary' }}>
              <MdLibraryBooks size={20} />
              <Typography sx={{ fontWeight: 800 }}>{ui.sources}</Typography>
            </Stack>
            <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {article.sources.map((s, i) => {
                const text = pick(s, lng);
                return (
                  <Box component="li" key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box aria-hidden sx={{ mt: '7px', width: 6, height: 6, borderRadius: '50%', bgcolor: 'secondary.main', flexShrink: 0 }} />
                    {s.url ? (
                      <MuiLink
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        sx={{ color: 'text.secondary', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { color: 'secondary.main' } }}
                      >
                        {text}
                        <MdOpenInNew size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                      </MuiLink>
                    ) : (
                      <Typography component="span" variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {text}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* CTA */}
        <Box
          sx={{
            mt: 6,
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            color: '#fff',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
            {ui.ctaTitle}
          </Typography>
          <Typography sx={{ opacity: 0.92, mb: 2.5, maxWidth: 520, mx: 'auto', lineHeight: 1.8 }}>
            {ui.ctaText}
          </Typography>
          <Button
            component={Link}
            href={localePath(lng, '/register')}
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#fff',
              color: 'primary.main',
              fontWeight: 800,
              px: 4,
              '&:hover': { bgcolor: alpha('#fff', 0.9) },
            }}
          >
            {ui.ctaButton}
          </Button>
        </Box>
      </Container>

      {/* Related */}
      {related.length > 0 && (
        <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', py: { xs: 5, md: 7 } }}>
          <Container maxWidth="lg">
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, textAlign: 'center' }}>
              {ui.related}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: { xs: 2.5, md: 3.5 },
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: `repeat(${Math.min(related.length, 3)}, 1fr)` },
                maxWidth: related.length < 3 ? 760 : 'none',
                mx: 'auto',
              }}
            >
              {related.map((a) => {
                const k = (a.categories || [])[0];
                const label = k && blogCategories[k] ? pick(blogCategories[k], lng) : null;
                return <ArticleCard key={a.slug} article={a} lng={lng} categoryLabel={label} />;
              })}
            </Box>
          </Container>
        </Box>
      )}
    </Box>
  );
}
