import { Suspense } from 'react';
import { GamesDashboard } from '@/features/games';

export const metadata = { title: 'ألعابي | Ayah Academy' };

export default function Page() {
  return (
    <Suspense>
      <GamesDashboard />
    </Suspense>
  );
}
