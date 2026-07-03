import { Suspense } from 'react';
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm.jsx';
import { buildMetadata } from '@/shared/lib/seo';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return buildMetadata({ lng, page: 'reset-password', path: '/reset-password', index: false });
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
