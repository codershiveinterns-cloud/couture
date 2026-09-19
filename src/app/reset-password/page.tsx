import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPageFallback } from '@/components/auth/AuthPageFallback';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new password for your Couture account.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthPageFallback eyebrow="Account recovery" title="Checking your reset link" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
