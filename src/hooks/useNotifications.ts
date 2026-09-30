import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHydrated } from '@/hooks/useHydrated';
import {
  getServerNotifications,
  listForUser,
  listOutbox,
  markAllRead as markAllReadService,
  markRead as markReadService,
  subscribeNotifications,
} from '@/lib/services/notifications';
import type { NotificationRecord } from '@/lib/services/types';

const EMPTY: readonly NotificationRecord[] = [];
const noopSubscribe = () => () => {};
const getEmpty = () => EMPTY;

export interface UseNotificationsResult {
  /** The signed-in user's in-app notifications, newest first ([] for guests). */
  items: readonly NotificationRecord[];
  unreadCount: number;
  isHydrated: boolean;
  markRead(id: string): void;
  markAllRead(): void;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const isHydrated = useHydrated();
  const getSnapshot = useCallback(() => (userId ? listForUser(userId) : EMPTY), [userId]);
  const items = useSyncExternalStore(userId ? subscribeNotifications : noopSubscribe, getSnapshot, getEmpty);

  return useMemo(
    () => ({
      items,
      unreadCount: items.reduce((count, n) => (n.read ? count : count + 1), 0),
      isHydrated,
      markRead: markReadService,
      markAllRead: () => {
        if (userId) markAllReadService(userId);
      },
    }),
    [items, isHydrated, userId],
  );
}

/** Admin: every rendered email in the outbox, newest first. */
export function useOutbox(): { emails: readonly NotificationRecord[]; isHydrated: boolean } {
  const emails = useSyncExternalStore(subscribeNotifications, listOutbox, getServerNotifications);
  const isHydrated = useHydrated();
  return useMemo(() => ({ emails, isHydrated }), [emails, isHydrated]);
}
