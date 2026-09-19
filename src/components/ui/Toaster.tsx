'use client';

import Link from 'next/link';
import { toast, useToasts, type ToastItem, type ToastVariant } from '@/context/ToastContext';

const STYLES: Record<ToastVariant, { ring: string; icon: string; path: string }> = {
  success: { ring: 'border-l-success', icon: 'text-success', path: 'M5 12.5l4.5 4.5L19 7.5' },
  error: { ring: 'border-l-brand-dark', icon: 'text-brand-dark', path: 'M6 6l12 12M18 6L6 18' },
  warning: { ring: 'border-l-discount', icon: 'text-discount', path: 'M12 8v5M12 16.5v.5M12 3l10 18H2z' },
  info: { ring: 'border-l-brand', icon: 'text-brand', path: 'M12 8h.01M11 12h1v5h1' },
};

function ToastCard({ item }: { item: ToastItem }) {
  const style = STYLES[item.variant];
  return (
    <div
      role={item.variant === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => toast.pause(item.id)}
      onMouseLeave={() => toast.resume(item.id)}
      onFocus={() => toast.pause(item.id)}
      onBlur={() => toast.resume(item.id)}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-sm border border-line border-l-[3px] bg-white p-3.5 pr-2.5 shadow-[0_4px_12px_rgba(40,44,63,0.15)] animate-fade-in-up ${style.ring}`}
    >
      <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center ${style.icon}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d={style.path} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug text-ink">{item.message}</p>
        {item.description && <p className="mt-0.5 truncate text-[13px] text-ink-3">{item.description}</p>}
        {item.action && (
          <Link
            href={item.action.href}
            onClick={() => toast.dismiss(item.id)}
            className="mt-1.5 inline-block text-[12px] font-bold uppercase tracking-wide text-brand underline-offset-2 hover:underline"
          >
            {item.action.label}
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(item.id)}
        aria-label="Dismiss notification"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-ink-3 transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[110] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default Toaster;
