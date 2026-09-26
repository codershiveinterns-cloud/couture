import Image from 'next/image';
import type { PillTone } from '@/components/admin/AdminPage';
import { isAllowedImageUrl, type StockLevel } from '@/lib/services/catalogStore';

export const STOCK_META: Record<StockLevel, { label: string; tone: PillTone }> = {
  in_stock: { label: 'In stock', tone: 'success' },
  low_stock: { label: 'Low stock', tone: 'warning' },
  out_of_stock: { label: 'Out of stock', tone: 'danger' },
};

export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

export const ROW_ACTION = `rounded-sm px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-ink-2 transition-colors hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:text-ink-4 ${FOCUS_RING}`;

export const ROW_ACTION_DANGER = `rounded-sm px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-brand transition-colors hover:bg-brand-light disabled:cursor-not-allowed disabled:text-ink-4 ${FOCUS_RING}`;

export function discountPercent(price: number, compareAtPrice: number | null): number | null {
  if (compareAtPrice === null || !Number.isFinite(price) || !Number.isFinite(compareAtPrice)) return null;
  if (price <= 0 || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}

/**
 * Square admin thumbnail. Unsplash URLs go through the next/image optimiser; anything else (a URL the
 * admin is still typing, or a legacy value) falls back to a plain <img> so it can never throw.
 */
export function AdminThumb({
  url,
  alt,
  size = 44,
  className = '',
}: {
  url: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
}) {
  const src = url?.trim() ?? '';
  const box = `relative shrink-0 overflow-hidden rounded-sm border border-line bg-surface ${className}`;
  if (!src || !/^https?:\/\//i.test(src)) {
    return (
      <span aria-hidden="true" style={{ width: size, height: size }} className={`${box} flex items-center justify-center text-ink-4`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinejoin="round" />
          <circle cx="9" cy="9" r="1.4" />
        </svg>
      </span>
    );
  }
  return (
    <span style={{ width: size, height: size }} className={`${box} block`}>
      {isAllowedImageUrl(src) ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      )}
    </span>
  );
}

export function SearchIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3.5">
          <span className="h-11 w-11 shrink-0 animate-pulse rounded-sm bg-surface" />
          <span className="h-3.5 flex-1 animate-pulse rounded-sm bg-surface" />
          <span className="hidden h-3.5 w-24 animate-pulse rounded-sm bg-surface sm:block" />
          <span className="h-3.5 w-16 animate-pulse rounded-sm bg-surface" />
        </div>
      ))}
    </div>
  );
}
