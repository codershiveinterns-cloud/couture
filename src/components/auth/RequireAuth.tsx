'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { isLogoutNavigationPending, useAuth } from '@/context/AuthContext';
import { buildLoginHref } from '@/lib/safeRedirect';

export interface RequireAuthProps {
  children: ReactNode;
  /** Shown while auth is hydrating and while the guest redirect is in flight. */
  fallback?: ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== 'guest' || isLogoutNavigationPending(pathname)) return;
    // Read the search string from the window so pages need no <Suspense> for useSearchParams.
    router.replace(buildLoginHref(`${window.location.pathname}${window.location.search}`));
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

  return <>{children}</>;
}

export default RequireAuth;
