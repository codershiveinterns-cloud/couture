'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { useAllOrders } from '@/hooks/useAllOrders';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ADMIN_LOGIN_PATH } from '@/lib/services/auth';
import { isOrderOpen } from '@/lib/services/orders';
import { ADMIN_NAV, isNavItemActive } from './adminNav';

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
    </svg>
  );
}

/** Admin chrome: fixed sidebar (drawer below lg) + slim top bar around the page content. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { orders, isHydrated } = useAllOrders();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useBodyScrollLock(drawerOpen);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onBreakpoint = () => {
      if (desktop.matches) setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onBreakpoint);
    };
  }, [drawerOpen]);

  const pendingOrders = isHydrated ? orders.filter(isOrderOpen).length : 0;
  const closeDrawer = () => setDrawerOpen(false);
  const handleLogout = () => {
    closeDrawer();
    logout({ redirectTo: ADMIN_LOGIN_PATH });
  };
  const initial = (user?.name.trim()[0] ?? 'A').toUpperCase();

  return (
    <div className="min-h-screen bg-surface lg:pl-60">
      {/* Drawer backdrop (mobile / tablet) */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-ink/50 transition-opacity duration-200 lg:hidden ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside
        id="admin-sidebar"
        aria-label="Admin"
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-white transition-[transform,visibility] duration-200 ease-out motion-reduce:transition-none lg:visible lg:translate-x-0 ${
          drawerOpen ? 'visible translate-x-0 shadow-[0_4px_16px_rgba(40,44,63,0.2)]' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Logo markClassName="h-8 w-8" wordmarkClassName="w-[88px]" />
            <span className="rounded-sm bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close menu"
            className={`-mr-2 flex h-9 w-9 items-center justify-center rounded-sm text-ink-3 transition-colors hover:bg-surface hover:text-ink lg:hidden ${FOCUS_RING}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto py-3">
          {ADMIN_NAV.map((group) => (
            <div key={group.title} className="mb-3">
              <p className="px-5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-ink-4">{group.title}</p>
              <ul>
                {group.items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeDrawer}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-3 border-l-[3px] px-4 py-2.5 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 ${
                          active
                            ? 'border-brand bg-brand-light font-bold text-brand'
                            : 'border-transparent text-ink-2 hover:bg-surface hover:text-ink'
                        }`}
                      >
                        {item.icon}
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.href === '/admin/orders' && pendingOrders > 0 && (
                          <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold leading-none text-white" aria-label={`${pendingOrders} pending`}>
                            {pendingOrders > 99 ? '99+' : pendingOrders}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-[14px] font-bold text-brand" aria-hidden="true">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-ink">{user?.name ?? 'Admin'}</p>
              <p className="truncate text-[12px] text-ink-3">{user?.email ?? ''}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/"
              onClick={closeDrawer}
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-sm border border-line-strong text-[12px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink ${FOCUS_RING}`}
            >
              View store
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={`inline-flex h-9 items-center justify-center rounded-sm border border-line-strong text-[12px] font-bold uppercase tracking-wide text-brand transition-colors hover:border-brand ${FOCUS_RING}`}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls="admin-sidebar"
          className={`-ml-2 flex h-10 w-10 items-center justify-center rounded-sm text-ink transition-colors hover:bg-surface lg:hidden ${FOCUS_RING}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <p className="text-[13px] font-bold uppercase tracking-wide text-ink lg:hidden">Couture Admin</p>
        <p className="hidden text-[13px] text-ink-3 lg:block">Store administration</p>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Link
            href="/admin/orders"
            className={`inline-flex h-9 items-center gap-2 rounded-sm border border-line px-3 text-[12px] font-bold text-ink-2 transition-colors hover:border-line-strong hover:text-ink ${FOCUS_RING}`}
          >
            <span className="hidden sm:inline">Pending orders</span>
            <span className="sm:hidden">Pending</span>
            <span
              className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none ${
                pendingOrders > 0 ? 'bg-brand text-white' : 'bg-surface text-ink-3'
              }`}
            >
              {isHydrated ? (pendingOrders > 99 ? '99+' : pendingOrders) : '–'}
            </span>
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-9 items-center gap-1.5 rounded-sm px-1 text-[12px] font-bold uppercase tracking-wide text-brand hover:underline ${FOCUS_RING}`}
          >
            View store
            <ExternalIcon />
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        </div>
      </header>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default AdminShell;
