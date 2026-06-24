import { Suspense } from 'react';
import { GamePlayPage } from '@/features/games';

// The single PUBLIC trial game is chosen by the admin from the dashboard
// (Game.isFree) and served from GET /games/public/free. It plays fully even
// without a database via the phone-manners dev fallback inside useGame. Every
// other game lives behind the dashboard.

export const metadata = {
  title: 'جرّب لعبة مجانية | Aya Academy',
  description: 'جرّب لعبة آداب تفاعلية مجانية من أكاديمية آية — وسجّل لتحصل على حصة تجريبية مجانية',
};

export default function FreeGameRoute() {
  return (
    <Suspense>
      <GamePlayPage free backHref="/" variant="marketing" />
    </Suspense>
  );
}
