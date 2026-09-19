import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPageFallback } from '@/components/auth/AuthPageFallback';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Couture account.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageFallback eyebrow="Welcome back" title="Login" />}>
      <LoginForm />
    </Suspense>
  );
}
