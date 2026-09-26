import type { ReactNode } from 'react';

/** Standard page frame for every admin screen: title row + optional actions, then content. */
export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-ink">{title}</h1>
          {description && <p className="mt-1 text-[14px] text-ink-3">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** White bordered panel used for tables, forms and charts. */
export function AdminCard({
  title,
  aside,
  children,
  className = '',
  padded = true,
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`rounded-sm border border-line bg-white ${className}`}>
      {(title || aside) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
          {title && <h2 className="text-[12px] font-bold uppercase tracking-wide text-ink">{title}</h2>}
          {aside}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const PILL_TONES: Record<PillTone, string> = {
  neutral: 'border-line-strong bg-surface text-ink-2',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-discount/40 bg-discount/10 text-discount',
  danger: 'border-brand/30 bg-brand-light text-brand',
  info: 'border-[#526cd0]/30 bg-[#526cd0]/10 text-[#526cd0]',
  brand: 'border-brand bg-brand text-white',
};

/** Small squared status tag (order status, payment status, stock state, active/inactive…). */
export function StatusPill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Shared table classes so every admin list looks the same. */
export const ADMIN_TABLE = {
  wrap: 'overflow-x-auto',
  table: 'w-full min-w-[720px] border-collapse text-left text-[14px]',
  th: 'border-b border-line bg-surface px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-3',
  td: 'border-b border-line px-4 py-3 align-middle text-ink-2',
  row: 'transition-colors hover:bg-surface/60',
} as const;
