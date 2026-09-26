import Link from 'next/link';
import type { ReactNode } from 'react';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface KpiTileProps {
  label: string;
  value: string;
  /** Small caption under the value, e.g. "+12% vs previous 7 days". */
  caption?: string;
  /** Adds an arrow + colour to the caption. Omit for neutral captions. */
  trend?: TrendDirection;
  /** Highlights the tile when it needs attention (pending orders, low stock). */
  attention?: boolean;
  icon?: ReactNode;
  href?: string;
}

const TREND_STYLES: Record<TrendDirection, string> = { up: 'text-success', down: 'text-brand', flat: 'text-ink-3' };
const TREND_GLYPH: Record<TrendDirection, string> = { up: '▲', down: '▼', flat: '—' };

/** Stat tile: a headline number, not a chart. */
export function KpiTile({ label, value, caption, trend, attention = false, icon, href }: KpiTileProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">{label}</p>
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${attention ? 'bg-brand-light text-brand' : 'bg-surface text-ink-3'}`} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-[24px] font-bold leading-tight tabular-nums text-ink">{value}</p>
      {caption && (
        <p className={`mt-1.5 text-[12px] ${trend ? TREND_STYLES[trend] : 'text-ink-3'}`}>
          {trend && (
            <span className="mr-1 text-[9px]" aria-hidden="true">
              {TREND_GLYPH[trend]}
            </span>
          )}
          {caption}
        </p>
      )}
    </>
  );
  const className = `block h-full rounded-sm border bg-white p-4 ${attention ? 'border-brand/40' : 'border-line'}`;

  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function KpiTileSkeleton() {
  return (
    <div className="rounded-sm border border-line bg-white p-4" aria-hidden="true">
      <div className="h-3 w-1/2 animate-pulse rounded-sm bg-surface" />
      <div className="mt-3 h-6 w-2/3 animate-pulse rounded-sm bg-surface" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded-sm bg-surface" />
    </div>
  );
}

/** Compares the most recent half of a zero-filled daily series with the half before it. */
export function halfOverHalfTrend(values: readonly number[]): { direction: TrendDirection; caption: string } {
  const half = Math.floor(values.length / 2);
  if (half === 0) return { direction: 'flat', caption: 'Not enough data yet' };
  const sum = (list: readonly number[]) => list.reduce((total, value) => total + value, 0);
  const recent = sum(values.slice(-half));
  const previous = sum(values.slice(-half * 2, -half));
  const period = `previous ${half} days`;
  if (previous === 0) return recent > 0 ? { direction: 'up', caption: `New activity vs ${period}` } : { direction: 'flat', caption: `No change vs ${period}` };
  const change = Math.round(((recent - previous) / previous) * 100);
  if (change === 0) return { direction: 'flat', caption: `No change vs ${period}` };
  return { direction: change > 0 ? 'up' : 'down', caption: `${change > 0 ? '+' : ''}${change}% vs ${period}` };
}

export default KpiTile;
