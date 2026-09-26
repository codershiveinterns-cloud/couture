'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { isLogoutNavigationPending, useAuth } from '@/context/AuthContext';
import { buildAdminLoginHref } from '@/lib/safeRedirect';

export interface RequireAdminProps {
  children: ReactNode;
  /** Shown while auth is hydrating and while the guest redirect is in flight. */
  fallback?: ReactNode;
}

/** Admin-area guard: guests go to /admin/login?next=…, signed-in customers see a 403 panel. */
export function RequireAdmin({ children, fallback }: RequireAdminProps) {
  const { status, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== 'guest' || isLogoutNavigationPending(pathname)) return;
    router.replace(buildAdminLoginHref(`${window.location.pathname}${window.location.search}`));
  }, [status, pathname, router]);

  if (status !== 'authenticated') {
    return (
      <>
        {fallback ?? (
          <div className="flex min-h-[50vh] items-center justify-center py-20 text-ink-4">
            <Spinner size="lg" label="Checking your session" />
          </div>
        )}
      </>
    );
  }

  if (!isAdmin) {
    return (
      <div role="alert" className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-[12px] font-bold uppercase tracking-wide text-brand">403 · Forbidden</p>
        <h1 className="mt-2 text-[20px] font-bold text-ink">You don&apos;t have access to the admin area</h1>
        <p className="mt-2 text-[14px] text-ink-3">
          This section is only available to store administrators. Sign in with an admin account to continue.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-sm bg-brand px-6 py-3 text-[14px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
        >
          Back to the store
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export default RequireAdmin;
