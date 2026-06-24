import { Suspense } from 'react';
import DashboardShell from '@/features/dashboard/components/DashboardShell.jsx';

export const metadata = { title: 'لوحة التحكم | Aya Academy' };

export default function DashboardLayout({ children }) {
  return (
    <Suspense>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
