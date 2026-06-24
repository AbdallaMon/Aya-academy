import { Suspense } from 'react';
import DashboardOverview from '@/features/dashboard/pages/DashboardOverview.jsx';

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardOverview />
    </Suspense>
  );
}
