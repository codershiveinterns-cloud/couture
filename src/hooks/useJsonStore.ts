import { useSyncExternalStore } from 'react';
import type { JsonStore } from '@/lib/storage';

/** Subscribes to a persisted JSON store; returns store.fallback during SSR/hydration. */
export function useJsonStore<T>(store: JsonStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}
