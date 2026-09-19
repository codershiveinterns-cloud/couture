import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPageFallback } from '@/components/auth/AuthPageFallback';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a Couture account to save your cart, wishlist and orders.',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthPageFallback eyebrow="Join Couture" title="Signup" />}>
      <RegisterForm />
    </Suspense>
  );
}
