import { Suspense } from 'react';
import CertificatesPage from '@/features/certificates/pages/CertificatesPage.jsx';

export default function Page() {
  return (
    <Suspense>
      <CertificatesPage />
    </Suspense>
  );
}
