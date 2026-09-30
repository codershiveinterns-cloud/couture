'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { BellIcon, formatRelativeTime, NotificationTypeIcon } from './notificationUtils';

const PREVIEW_COUNT = 6;

/** Header bell: unread badge + dropdown of the latest notifications. Renders nothing for guests. */
export function NotificationBell() {
  const pathname = usePathname();
  const { status } = useAuth();
  const { items, unreadCount, isHydrated, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (status !== 'authenticated') return null;

  const badge = isHydrated && unreadCount > 0 ? unreadCount : null;
  const latest = items.slice(0, PREVIEW_COUNT);
  const active = open || pathname.startsWith('/account/notifications');
  const tab = open ? 0 : -1;

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="notifications-menu"
        aria-label={badge ? `Notifications (${badge} unread)` : 'Notifications'}
        className={`relative flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-sm text-[12px] font-bold text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:h-20 lg:w-auto lg:rounded-none lg:border-b-4 lg:border-t-4 lg:border-t-transparent lg:px-2 lg:hover:bg-transparent lg:focus-visible:ring-inset ${
          active ? 'lg:border-b-brand' : 'lg:border-b-transparent'
        }`}
      >
        <span className="relative">
          <BellIcon />
          {badge !== null && (
            <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] animate-fade-in items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
        <span className="hidden leading-none xl:block">Alerts</span>
      </button>

      <div
        className={`absolute right-0 top-full z-50 w-[calc(100vw-2rem)] max-w-[340px] pt-1 transition-opacity duration-150 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          id="notifications-menu"
          role="menu"
          aria-hidden={!open}
          aria-label="Notifications"
          className="rounded-sm border border-line bg-white shadow-[0_4px_12px_rgba(40,44,63,0.15)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-[14px] font-bold text-ink">
              Notifications
              {badge !== null && <span className="ml-1.5 text-[12px] font-bold text-brand">{badge} new</span>}
            </p>
            {badge !== null && (
              <button
                type="button"
                role="menuitem"
                tabIndex={tab}
                onClick={markAllRead}
                className="text-[12px] font-bold uppercase tracking-wide text-brand transition-colors hover:text-brand-dark focus-visible:outline-none focus-visible:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {!isHydrated ? (
            <div className="space-y-2 p-4" aria-hidden="true">
              <div className="h-4 w-2/3 animate-pulse rounded-sm bg-surface" />
              <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface" />
            </div>
          ) : latest.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-ink-3">
              You&rsquo;re all caught up. Order updates will show up here.
            </p>
          ) : (
            <ul className="max-h-[min(60vh,420px)] overflow-y-auto py-1">
              {latest.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    role="menuitem"
                    tabIndex={tab}
                    onClick={() => {
                      markRead(n.id);
                      close();
                    }}
                    className={`flex gap-3 px-4 py-2.5 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:bg-surface ${
                      n.read ? '' : 'bg-brand-light/30'
                    }`}
                  >
                    <NotificationTypeIcon type={n.type} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] ${n.read ? 'text-ink-2' : 'font-bold text-ink'}`}>
                        {n.title}
                        {!n.read && <span className="sr-only"> (unread)</span>}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[12px] text-ink-3">{n.body}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-4">{formatRelativeTime(n.createdAt)}</span>
                    </span>
                    {!n.read && <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-line py-1.5">
            <Link
              href="/account/notifications"
              role="menuitem"
              tabIndex={tab}
              onClick={close}
              className="flex items-center justify-center px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-brand transition-colors hover:bg-surface focus-visible:outline-none focus-visible:bg-surface"
            >
              View all
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationBell;
