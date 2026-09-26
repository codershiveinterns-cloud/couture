import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPageFallback } from '@/components/auth/AuthPageFallback';
import { AdminLoginForm } from './AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin sign in',
  description: 'Sign in to the Couture admin area.',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    /* AuthCard is sized for pages with the storefront header; here it fills the whole viewport. */
    <div className="[&>div]:min-h-screen">
      <Suspense fallback={<AuthPageFallback eyebrow="Couture Admin" title="Admin sign in" />}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
