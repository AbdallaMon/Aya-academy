import { Suspense } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { GamePlayPage } from '@/features/games';
import { getFreeGameContent } from '@/features/games/data/freeGameContent.js';
import { buildMetadata } from '@/shared/lib/seo';

// The single PUBLIC trial game is chosen by the admin from the dashboard
// (Game.isFree) and served from GET /games/public/free. It plays fully even
// without a database via the phone-manners dev fallback inside useGame. Every
// other game lives behind the dashboard.

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return buildMetadata({ lng, page: 'freeGame', path: '/free-game' });
}

export default async function FreeGameRoute({ params }) {
  const { lng } = await params;
  const content = getFreeGameContent(lng);

  return (
    <>
      <Box
        component="header"
        sx={{
          py: { xs: 5, md: 7 },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography component="h1" variant="h2" sx={{ mb: 1.5, fontWeight: 900 }}>
            {content.title}
          </Typography>
          <Typography
            component="p"
            variant="h6"
            sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.8, maxWidth: 720, mx: 'auto' }}
          >
            {content.subtitle}
          </Typography>
        </Container>
      </Box>
      <Suspense fallback={<Box sx={{ minHeight: 480 }} aria-hidden />}>
        <GamePlayPage free backHref="/" variant="marketing" />
      </Suspense>
    </>
  );
}
