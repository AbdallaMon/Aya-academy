import { Suspense } from 'react';
import { BackupsPage } from '@/features/backups';

export const metadata = {
  title: 'النسخ الاحتياطية | Ayah Academy Backups',
  description:
    'إدارة النسخ الاحتياطية وحسابات Google Drive ومفاتيح التشفير واسترجاع قاعدة البيانات.',
};

// Gated by PERMISSIONS.BACKUP.MANAGE inside BackupsPage (usePermission).
// Suspense is required because BackupsPage reads useSearchParams (OAuth return).
export default function Page() {
  return (
    <Suspense>
      <BackupsPage />
    </Suspense>
  );
}
