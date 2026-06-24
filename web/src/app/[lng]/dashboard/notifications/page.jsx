import { Suspense } from 'react';
import NotificationsPage from '@/features/notifications/pages/NotificationsPage.jsx';

export default function Page() {
  return (
    <Suspense>
      <NotificationsPage />
    </Suspense>
  );
}
