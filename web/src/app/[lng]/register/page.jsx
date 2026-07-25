import { Suspense } from 'react';
import RegisterWizard from '@/features/auth/components/RegisterWizard.jsx';
import { buildMetadata } from '@/shared/lib/seo';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return buildMetadata({ lng, page: 'register', path: '/register', index: false });
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterWizard />
    </Suspense>
  );
}
