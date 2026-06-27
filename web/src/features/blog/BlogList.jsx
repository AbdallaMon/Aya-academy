'use client';

// Blog index — hero header + client-side search/category filtering over the
// data file in features/blog/data/articles.js. Fully bilingual + RTL aware.

import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { MdSearch, MdMenuBook } from 'react-icons/md';
import { useTranslation } from '@/i18n/client.js';
import { sortedArticles, blogCategories, presentCategories } from './data/articles';
import { pickBlogUi } from './data/ui';
import { pick } from './lib/helpers';
import ArticleCard from './components/ArticleCard';

const MotionBox = motion.create(Box);

export default function BlogList() {
  const { lng } = useTranslation();
  const theme = useTheme();
  const ui = pickBlogUi(lng);
  const categories = presentCategories(lng);

  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortedArticles.filter((a) => {
      if (activeCat !== 'all' && !(a.categories || []).includes(activeCat)) return false;
      if (!q) return true;
      const haystack = [
        pick(a.title, lng),
        pick(a.description, lng),
        ...(a.tags || []).map((t) => pick(t, lng)),
        ...(a.categories || []).map((k) => (blogCategories[k] ? pick(blogCategories[k], lng) : '')),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeCat, lng]);

  const catLabelOf = (a) => {
    const key = (a.categories || [])[0];
    return key && blogCategories[key] ? pick(blogCategories[key], lng) : null;
  };

  return (
    <Box component="main">
      {/* Hero header */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 7, md: 10 },
          pb: { xs: 6, md: 8 },
          textAlign: 'center',
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
            background: `radial-gradient(50% 60% at 50% 0%, ${alpha(theme.palette.primary.main, 0.16)}, transparent 70%), radial-gradient(40% 50% at 85% 30%, ${alpha(theme.palette.secondary.main, 0.14)}, transparent 70%)`,
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Chip
            icon={<MdMenuBook />}
            label={ui.eyebrow}
            color="primary"
            sx={{ fontWeight: 800, mb: 2, px: 0.5 }}
          />
          <Typography variant="h2" sx={{ mb: 2, fontWeight: 900 }}>
            {ui.title}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, color: 'text.secondary', lineHeight: 1.8 }}>
            {ui.subtitle}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        {/* Controls */}
        <Stack spacing={2.5} sx={{ mb: { xs: 4, md: 5 } }}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui.searchPlaceholder}
            fullWidth
            sx={{ maxWidth: 520, mx: 'auto', '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch size={20} />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
            <Chip
              label={ui.all}
              clickable
              color={activeCat === 'all' ? 'primary' : 'default'}
              variant={activeCat === 'all' ? 'filled' : 'outlined'}
              onClick={() => setActiveCat('all')}
              sx={{ fontWeight: 700 }}
            />
            {categories.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                clickable
                color={activeCat === c.key ? 'primary' : 'default'}
                variant={activeCat === c.key ? 'filled' : 'outlined'}
                onClick={() => setActiveCat(c.key)}
                sx={{ fontWeight: 700 }}
              />
            ))}
          </Stack>
        </Stack>

        {/* Grid */}
        {filtered.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 2.5, md: 3.5 },
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            }}
          >
            {filtered.map((a, i) => (
              <MotionBox
                key={a.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                sx={{ height: '100%' }}
              >
                <ArticleCard article={a} lng={lng} categoryLabel={catLabelOf(a)} />
              </MotionBox>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ fontSize: 56, mb: 1 }}>🔍</Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              {ui.noResults}
            </Typography>
            <Typography color="text.secondary">{ui.noResultsHint}</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
