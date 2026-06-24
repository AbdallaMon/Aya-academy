import { Suspense } from 'react';
import LoginForm from '@/features/auth/components/LoginForm.jsx';

export const metadata = { title: 'تسجيل الدخول | Aya Academy' };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
