import { Suspense } from 'react';
import RegisterForm from '@/features/auth/components/RegisterForm.jsx';

export const metadata = { title: 'إنشاء حساب | Aya Academy' };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
