import { Suspense } from 'react';
import LoginForm from '@/features/auth/components/LoginForm.jsx';
import { buildMetadata } from '@/shared/lib/seo';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return buildMetadata({ lng, page: 'login', path: '/login' });
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
