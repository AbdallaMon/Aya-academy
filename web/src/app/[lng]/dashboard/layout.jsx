import { Suspense } from 'react';
import {
  Amiri,
  Scheherazade_New,
  Reem_Kufi,
  Aref_Ruqaa,
  Noto_Naskh_Arabic,
} from 'next/font/google';
import DashboardShell from '@/features/dashboard/components/DashboardShell.jsx';

// The dashboard is private (auth-gated): keep a sensible title but tell search
// engines NOT to index any of it.
const DASHBOARD_TITLE = { ar: 'لوحة التحكم', en: 'Dashboard' };

// Certificate fonts belong only to the authenticated dashboard. Keeping them
// here prevents public pages from preloading five unrelated font families.
const amiri = Amiri({ variable: '--font-amiri', weight: ['400', '700'], subsets: ['arabic', 'latin'], display: 'swap' });
const scheherazade = Scheherazade_New({ variable: '--font-scheherazade', weight: ['400', '700'], subsets: ['arabic', 'latin'], display: 'swap' });
const reemKufi = Reem_Kufi({ variable: '--font-reem-kufi', subsets: ['arabic', 'latin'], display: 'swap' });
const arefRuqaa = Aref_Ruqaa({ variable: '--font-aref-ruqaa', weight: ['400', '700'], subsets: ['arabic', 'latin'], display: 'swap' });
const notoNaskh = Noto_Naskh_Arabic({ variable: '--font-noto-naskh', subsets: ['arabic', 'latin'], display: 'swap' });

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return {
    title: DASHBOARD_TITLE[lng] || DASHBOARD_TITLE.ar,
    robots: { index: false, follow: false },
  };
}

export default function DashboardLayout({ children }) {
  return (
    <div className={`${amiri.variable} ${scheherazade.variable} ${reemKufi.variable} ${arefRuqaa.variable} ${notoNaskh.variable}`}>
      <Suspense>
        <DashboardShell>{children}</DashboardShell>
      </Suspense>
    </div>
  );
}
