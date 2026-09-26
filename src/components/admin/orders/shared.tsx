'use client';

import type { ReactNode } from 'react';
import { ADMIN_TABLE, StatusPill, type PillTone } from '@/components/admin/AdminPage';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/services/orders';
import type { OrderStatus, PaymentStatus } from '@/lib/services/types';

export const ORDER_STATUS_TONES: Record<OrderStatus, PillTone> = {
  PLACED: 'info',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  SHIPPED: 'warning',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'neutral',
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, PillTone> = {
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  CANCELLED: 'neutral',
  REFUNDED: 'neutral',
};

/** Short method names for dense tables (the long labels live in PAYMENT_METHOD_LABELS). */
export const PAYMENT_METHOD_SHORT = { COD: 'COD', CARD: 'Card', UPI: 'UPI' } as const;

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <StatusPill tone={ORDER_STATUS_TONES[status]}>{ORDER_STATUS_LABELS[status]}</StatusPill>;
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return <StatusPill tone={PAYMENT_STATUS_TONES[status]}>{PAYMENT_STATUS_LABELS[status]}</StatusPill>;
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function safeFormat(format: Intl.DateTimeFormat, iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : format.format(date);
}

export const formatDate = (iso: string | null | undefined) => safeFormat(DATE_FORMAT, iso);
export const formatDateTime = (iso: string | null | undefined) => safeFormat(DATE_TIME_FORMAT, iso);

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-light font-bold text-brand ${
        size === 'lg' ? 'h-14 w-14 text-[18px]' : 'h-9 w-9 text-[12px]'
      }`}
    >
      {initialsOf(name)}
    </span>
  );
}

export const LINK_CLASS =
  'rounded-sm font-bold text-ink underline-offset-2 outline-none hover:text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand/40';

export const FILTER_CONTROL_CLASS =
  'h-10 rounded-sm border border-line-strong bg-white px-3 text-[14px] text-ink outline-none transition-colors hover:border-ink-4 focus:border-ink focus-visible:ring-2 focus-visible:ring-brand/40';

export function SearchIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

/** Labelled search box used above every admin list. */
export function SearchBox({
  id,
  label,
  value,
  onChange,
  placeholder,
  className = '',
}: {
  id: string;
  label: string;
  value: string;
  onChange(value: string): void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-3">
        <SearchIcon />
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? label}
        className={`${FILTER_CONTROL_CLASS} w-full pl-9`}
      />
    </div>
  );
}

/** Compact labelled <select> for filter bars. */
export function FilterSelect<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: NoInfer<T>;
  onChange: (value: NoInfer<T>) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={`${FILTER_CONTROL_CLASS} pr-8`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export type SortDir = 'asc' | 'desc';

/** Sortable column header (button inside a <th scope="col"> with aria-sort). */
export function SortableTh({
  label,
  active,
  dir,
  onSort,
  align = 'left',
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onSort(): void;
  align?: 'left' | 'right';
}) {
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`${ADMIN_TABLE.th} ${align === 'right' ? 'text-right' : ''}`}
    >
      <button
        type="button"
        onClick={onSort}
        className={`inline-flex items-center gap-1 rounded-sm font-bold uppercase tracking-wide outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/40 ${
          active ? 'text-ink' : ''
        }`}
      >
        {label}
        <span aria-hidden="true" className={active ? '' : 'opacity-30'}>
          {active && dir === 'asc' ? '▲' : '▼'}
        </span>
      </button>
    </th>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  noun = 'results',
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage(page: number): void;
  noun?: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const buttonClass =
    'h-9 rounded-sm border border-line-strong bg-white px-3 text-[12px] font-bold uppercase tracking-wide text-ink outline-none transition-colors hover:border-ink focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:border-line disabled:text-ink-4';
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-ink-3"
    >
      <p>
        Showing <span className="font-bold text-ink">{from}</span>–<span className="font-bold text-ink">{to}</span> of{' '}
        <span className="font-bold text-ink">{total}</span> {noun}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={buttonClass} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="tabular-nums">
          Page {page} of {pageCount}
        </span>
        <button type="button" className={buttonClass} disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4">
          <div className="h-4 w-24 animate-pulse rounded-sm bg-surface" />
          <div className="h-4 flex-1 animate-pulse rounded-sm bg-surface" />
          <div className="h-4 w-20 animate-pulse rounded-sm bg-surface" />
        </div>
      ))}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-sm border border-line bg-white px-4 py-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">{label}</p>
      <p className="mt-1 text-[20px] font-bold leading-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-ink-3">{hint}</p>}
    </div>
  );
}

export function TableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-[14px] text-ink-3">
        {children}
      </td>
    </tr>
  );
}

export function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span role="img" aria-label={`${rating} out of 5 stars`} className="inline-flex text-[14px] leading-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={n <= rounded ? 'text-rating' : 'text-line-strong'}>
          ★
        </span>
      ))}
    </span>
  );
}

/** Triggers a client-side CSV download. Call from event handlers only. */
export function downloadCsv(filename: string, rows: readonly (readonly (string | number | null)[])[]): void {
  const escape = (cell: string | number | null) => {
    let text = cell === null ? '' : String(cell);
    // Neutralise spreadsheet formula injection from user-supplied text.
    if (/^[=+\-@\t\r]/.test(text) && typeof cell === 'string') text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
