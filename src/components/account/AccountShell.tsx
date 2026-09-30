'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/account', label: 'Overview', exact: true },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/notifications', label: 'Notifications' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/wishlist', label: 'Wishlist' },
];

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const ROW_BASE =
  'flex w-full items-center border-b border-line px-4 py-3 text-left text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink';

const NOTIFICATIONS_HREF = '/account/notifications';

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold leading-none text-white">
      {count > 99 ? '99+' : count}
      <span className="sr-only"> unread</span>
    </span>
  );
}

function AccountNav() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { unreadCount, isHydrated: notificationsHydrated } = useNotifications();
  const badgeFor = (item: NavItem) => (item.href === NOTIFICATIONS_HREF && notificationsHydrated ? unreadCount : 0);

  return (
    <aside className="lg:w-60 lg:shrink-0">
      {/* Desktop: vertical rows with a brand left border on the active item. */}
      <nav aria-label="Account" className="hidden rounded-sm border border-line bg-white lg:block">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`${ROW_BASE} border-l-[3px] ${
                active
                  ? 'border-l-brand bg-brand-light/40 font-bold text-brand'
                  : 'border-l-transparent text-ink-2 hover:bg-surface hover:text-ink'
              }`}
            >
              {item.label}
              <NavBadge count={badgeFor(item)} />
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => logout({ redirectTo: '/' })}
          className={`${ROW_BASE} border-b-0 border-l-[3px] border-l-transparent text-ink-2 hover:bg-surface hover:text-brand`}
        >
          Log out
        </button>
      </nav>

      {/* Mobile / tablet: horizontal scrollable tabs. */}
      <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex min-w-max items-center border-b border-line">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[13px] uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                  active ? 'border-brand font-bold text-brand' : 'border-transparent font-bold text-ink-3 hover:text-ink'
                }`}
              >
                {item.label}
                <NavBadge count={badgeFor(item)} />
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => logout({ redirectTo: '/' })}
            className="-mb-px ml-auto whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-[13px] font-bold uppercase tracking-wide text-ink-3 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            Log out
          </button>
        </div>
      </nav>
    </aside>
  );
}

function AccountHeader() {
  const { user } = useAuth();
  return (
    <div className="border-b border-line pb-4">
      <h1 className="text-[20px] font-bold text-ink sm:text-[24px]">Account</h1>
      {user && (
        <p className="mt-1 text-[14px] text-ink-2">
          <span className="font-bold text-ink">{user.name}</span>
          <span className="mx-2 text-ink-4" aria-hidden="true">
            ·
          </span>
          <span className="text-ink-3">{user.email}</span>
        </p>
      )}
    </div>
  );
}

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <RequireAuth>
        <div className="animate-fade-in">
          <AccountHeader />
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            <AccountNav />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </RequireAuth>
    </div>
  );
}

export default AccountShell;
