import { Suspense } from 'react';
import { GamesDashboard } from '@/features/games';

export const metadata = { title: 'ألعابي | Aya Academy' };

export default function Page() {
  return (
    <Suspense>
      <GamesDashboard />
    </Suspense>
  );
}
