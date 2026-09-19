export const STORAGE_PREFIX = 'couture:v1:';
export const STORAGE_EVENT = 'couture:storage';
export const GUEST_OWNER = 'guest';

export const storageKeys = {
  users: `${STORAGE_PREFIX}users`,
  session: `${STORAGE_PREFIX}session`,
  resetTokens: `${STORAGE_PREFIX}resetTokens`,
  reviews: `${STORAGE_PREFIX}reviews`,
  cart: (owner: string) => `${STORAGE_PREFIX}cart:${owner}`,
  coupon: (owner: string) => `${STORAGE_PREFIX}coupon:${owner}`,
  wishlist: (owner: string) => `${STORAGE_PREFIX}wishlist:${owner}`,
  addresses: (userId: string) => `${STORAGE_PREFIX}addresses:${userId}`,
  orders: (userId: string) => `${STORAGE_PREFIX}orders:${userId}`,
} as const;

const isBrowser = () => typeof window !== 'undefined';

// Values that could not be persisted (private mode, quota) live here and take precedence.
const memory = new Map<string, string | null>();
let localStorageUsable: boolean | null = null;

function canUseLocalStorage(): boolean {
  if (!isBrowser()) return false;
  if (localStorageUsable !== null) return localStorageUsable;
  try {
    const probe = `${STORAGE_PREFIX}__probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    localStorageUsable = true;
  } catch {
    localStorageUsable = false;
  }
  return localStorageUsable;
}

export function readRaw(key: string): string | null {
  if (!isBrowser()) return null;
  if (memory.has(key)) return memory.get(key) ?? null;
  if (!canUseLocalStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string | null): void {
  if (!isBrowser()) return;
  let persisted = false;
  if (canUseLocalStorage()) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
      persisted = true;
    } catch {
      persisted = false;
    }
  }
  if (persisted) memory.delete(key);
  else memory.set(key, value);
  notifyKey(key);
}

export function removeKey(key: string): void {
  writeRaw(key, null);
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  writeRaw(key, JSON.stringify(value));
}

const listeners = new Map<string, Set<() => void>>();
let windowListenersAttached = false;

function emit(key: string) {
  const set = listeners.get(key);
  if (!set) return;
  [...set].forEach((cb) => cb());
}

function emitAll() {
  [...listeners.keys()].forEach(emit);
}

function attachWindowListeners() {
  if (windowListenersAttached || !isBrowser()) return;
  windowListenersAttached = true;
  window.addEventListener('storage', (event) => {
    if (event.key === null) emitAll();
    else if (event.key.startsWith(STORAGE_PREFIX)) emit(event.key);
  });
  window.addEventListener(STORAGE_EVENT, (event) => {
    const key = (event as CustomEvent<{ key?: string }>).detail?.key;
    if (typeof key === 'string') emit(key);
  });
}

export function notifyKey(key: string): void {
  if (!isBrowser()) return;
  attachWindowListeners();
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }));
}

export function subscribeKey(key: string, callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  attachWindowListeners();
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(callback);
  return () => {
    set.delete(callback);
    if (set.size === 0) listeners.delete(key);
  };
}

export function subscribeKeys(keys: readonly string[], callback: () => void): () => void {
  const unsubs = keys.map((key) => subscribeKey(key, callback));
  return () => unsubs.forEach((unsub) => unsub());
}

export interface JsonStore<T> {
  readonly key: string;
  readonly fallback: T;
  /** Referentially stable while the stored string is unchanged (safe as a useSyncExternalStore snapshot). */
  get(): T;
  getServerSnapshot(): T;
  set(value: T): void;
  update(updater: (prev: T) => T): T;
  clear(): void;
  subscribe(callback: () => void): () => void;
}

const stores = new Map<string, JsonStore<unknown>>();

/**
 * Returns the memoized store for `key`. `fallback` must be a module-level constant and
 * `sanitize` must turn any parsed JSON into a valid T (return fallback for garbage).
 * The first call for a key fixes its fallback/sanitize.
 */
export function getJsonStore<T>(key: string, fallback: T, sanitize: (value: unknown) => T): JsonStore<T> {
  const existing = stores.get(key);
  if (existing) return existing as JsonStore<T>;

  let initialized = false;
  let lastRaw: string | null = null;
  let lastValue: T = fallback;

  const store: JsonStore<T> = {
    key,
    fallback,
    get() {
      const raw = readRaw(key);
      if (initialized && raw === lastRaw) return lastValue;
      let value = fallback;
      if (raw !== null) {
        try {
          value = sanitize(JSON.parse(raw));
        } catch {
          value = fallback;
        }
      }
      initialized = true;
      lastRaw = raw;
      lastValue = value;
      return value;
    },
    getServerSnapshot: () => fallback,
    set(value) {
      writeJSON(key, value);
    },
    update(updater) {
      const next = updater(store.get());
      store.set(next);
      return next;
    },
    clear() {
      removeKey(key);
    },
    subscribe: (callback) => subscribeKey(key, callback),
  };

  stores.set(key, store as JsonStore<unknown>);
  return store;
}

export function sanitizeArray<T>(value: unknown, isItem: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? value.filter(isItem) : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
