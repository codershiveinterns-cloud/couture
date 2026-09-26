'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { RequireAdmin } from '@/components/auth/RequireAdmin';
import { Spinner } from '@/components/ui/Spinner';
import { ADMIN_LOGIN_PATH } from '@/lib/services/auth';

/** Admin area frame: everything except the sign-in page sits behind RequireAdmin inside the shell. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === ADMIN_LOGIN_PATH) return <>{children}</>;

  return (
    <RequireAdmin
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface text-ink-4">
          <Spinner size="lg" label="Checking your session" />
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
