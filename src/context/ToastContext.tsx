'use client';

import { useSyncExternalStore } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  href: string;
}

export interface ToastOptions {
  /** Reusing an id replaces the existing toast (useful to collapse repeated notices). */
  id?: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds; 0 keeps the toast until dismissed. */
  duration?: number;
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  message: string;
  description: string | null;
  variant: ToastVariant;
  duration: number;
  action: ToastAction | null;
}

export interface ToastApi {
  show(message: string, options?: ToastOptions): string;
  success(message: string, options?: Omit<ToastOptions, 'variant'>): string;
  error(message: string, options?: Omit<ToastOptions, 'variant'>): string;
  info(message: string, options?: Omit<ToastOptions, 'variant'>): string;
  warning(message: string, options?: Omit<ToastOptions, 'variant'>): string;
  dismiss(id: string): void;
  clear(): void;
  pause(id: string): void;
  resume(id: string): void;
}

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3500,
  info: 3500,
  warning: 5000,
  error: 6000,
};
const MAX_VISIBLE = 4;
const EMPTY: readonly ToastItem[] = [];

const state: { toasts: readonly ToastItem[]; counter: number } = { toasts: EMPTY, counter: 0 };
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  [...listeners].forEach((listener) => listener());
}

function clearTimer(id: string) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}

function schedule(item: ToastItem) {
  clearTimer(item.id);
  if (typeof window === 'undefined' || item.duration <= 0) return;
  timers.set(
    item.id,
    setTimeout(() => dismiss(item.id), item.duration),
  );
}

function dismiss(id: string) {
  clearTimer(id);
  if (!state.toasts.some((t) => t.id === id)) return;
  state.toasts = state.toasts.filter((t) => t.id !== id);
  emit();
}

function show(message: string, options: ToastOptions = {}): string {
  const variant = options.variant ?? 'info';
  state.counter += 1;
  const item: ToastItem = {
    id: options.id ?? `toast-${state.counter}`,
    message,
    description: options.description ?? null,
    variant,
    duration: options.duration ?? DEFAULT_DURATION[variant],
    action: options.action ?? null,
  };
  const next = [...state.toasts.filter((t) => t.id !== item.id), item];
  next.slice(0, Math.max(0, next.length - MAX_VISIBLE)).forEach((t) => clearTimer(t.id));
  state.toasts = next.slice(-MAX_VISIBLE);
  emit();
  schedule(item);
  return item.id;
}

export const toast: ToastApi = {
  show,
  success: (message, options) => show(message, { ...options, variant: 'success' }),
  error: (message, options) => show(message, { ...options, variant: 'error' }),
  info: (message, options) => show(message, { ...options, variant: 'info' }),
  warning: (message, options) => show(message, { ...options, variant: 'warning' }),
  dismiss,
  clear: () => {
    [...timers.keys()].forEach(clearTimer);
    state.toasts = EMPTY;
    emit();
  },
  pause: (id) => clearTimer(id),
  resume: (id) => {
    const item = state.toasts.find((t) => t.id === id);
    if (item) schedule(item);
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state.toasts;
const getServerSnapshot = () => EMPTY;

/** Stable toast API; no provider needed (the <Toaster /> in Providers renders them). */
export function useToast(): ToastApi {
  return toast;
}

export function useToasts(): readonly ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
