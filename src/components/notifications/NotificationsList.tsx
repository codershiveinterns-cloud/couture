'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingPanel } from '@/components/account/accountUtils';
import { useNotifications } from '@/hooks/useNotifications';
import { NOTIFICATION_TYPE_LABELS } from '@/lib/services/notifications';
import { BellIcon, formatRelativeTime, NotificationTypeIcon } from './notificationUtils';

/** /account/notifications: every in-app notification, unread first-class, click marks read + follows the deep link. */
export function NotificationsList() {
  const { items, unreadCount, isHydrated, markRead, markAllRead } = useNotifications();

  if (!isHydrated) return <LoadingPanel label="Loading notifications" />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-ink">Notifications</h2>
          <p className="mt-1 text-[13px] text-ink-3">
            {items.length === 0
              ? 'Order and account updates will appear here.'
              : unreadCount > 0
                ? `${unreadCount} unread of ${items.length}`
                : `All ${items.length} read`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No notifications yet"
          description="We'll let you know when an order is confirmed, ships, or is delivered — and if a payment needs attention."
          icon={<BellIcon size={28} />}
          action={<Button href="/products">Start shopping</Button>}
        />
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-sm border border-line bg-white">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={n.href}
                onClick={() => markRead(n.id)}
                aria-label={`${n.read ? '' : 'Unread: '}${n.title}`}
                className={`flex gap-4 px-4 py-4 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 sm:px-5 ${
                  n.read ? '' : 'border-l-[3px] border-l-brand bg-brand-light/30'
                }`}
              >
                <NotificationTypeIcon type={n.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className={`text-[14px] ${n.read ? 'text-ink-2' : 'font-bold text-ink'}`}>{n.title}</p>
                    <time dateTime={n.createdAt} className="text-[12px] text-ink-4">
                      {formatRelativeTime(n.createdAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-2">{n.body}</p>
                  <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-3">
                    {NOTIFICATION_TYPE_LABELS[n.type]}
                    {n.orderNumber && (
                      <>
                        <span className="mx-1.5 text-ink-4" aria-hidden="true">
                          ·
                        </span>
                        {n.orderNumber}
                      </>
                    )}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsList;
