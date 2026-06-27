import { Suspense } from 'react';
import { GamePlayPage } from '@/features/games';
import { buildMetadata } from '@/shared/lib/seo';

// The single PUBLIC trial game is chosen by the admin from the dashboard
// (Game.isFree) and served from GET /games/public/free. It plays fully even
// without a database via the phone-manners dev fallback inside useGame. Every
// other game lives behind the dashboard.

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return buildMetadata({ lng, page: 'freeGame', path: '/free-game' });
}

export default function FreeGameRoute() {
  return (
    <Suspense>
      <GamePlayPage free backHref="/" variant="marketing" />
    </Suspense>
  );
}
