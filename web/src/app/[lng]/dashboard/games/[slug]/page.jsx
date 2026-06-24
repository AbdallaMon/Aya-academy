import { Suspense } from 'react';
import { GamePlayPage } from '@/features/games';

// Play a game INSIDE the dashboard shell. Next 16: route `params` is async.
export default async function Page({ params }) {
  const { slug } = await params;
  return (
    <Suspense>
      <GamePlayPage slug={slug} backHref="/dashboard/games" variant="dashboard" />
    </Suspense>
  );
}
