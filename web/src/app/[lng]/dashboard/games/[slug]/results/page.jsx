import { Suspense } from 'react';
import { GameResultsPage } from '@/features/games';

// Per-game results (ADMIN). Next 16: route `params` is async.
export default async function Page({ params }) {
  const { slug } = await params;
  return (
    <Suspense>
      <GameResultsPage slug={slug} />
    </Suspense>
  );
}
