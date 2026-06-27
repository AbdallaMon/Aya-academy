import { Suspense } from 'react';
import DashboardShell from '@/features/dashboard/components/DashboardShell.jsx';

// The dashboard is private (auth-gated): keep a sensible title but tell search
// engines NOT to index any of it. robots.js also disallows /*/dashboard.
const DASHBOARD_TITLE = { ar: 'لوحة التحكم', en: 'Dashboard' };

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return {
    title: DASHBOARD_TITLE[lng] || DASHBOARD_TITLE.ar,
    robots: { index: false, follow: false },
  };
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
