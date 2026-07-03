import { Suspense } from 'react';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm.jsx';
import { buildMetadata } from '@/shared/lib/seo';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return buildMetadata({ lng, page: 'forgot-password', path: '/forgot-password', index: false });
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
