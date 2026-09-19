import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AccountShell from '@/components/account/AccountShell';

export const metadata: Metadata = {
  // Nested layouts don't inherit the root title template, so restate it for /account/* pages.
  title: { default: 'My Account', template: '%s | Couture' },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
