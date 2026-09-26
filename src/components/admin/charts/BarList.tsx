import type { ReactNode } from 'react';
import { CHART_COLORS } from './chartUtils';

export interface BarListItem {
  key: string;
  label: ReactNode;
  value: number;
  /** Text shown at the end of the row (defaults to the raw value). */
  valueLabel?: string;
  /** Muted secondary text after the value, e.g. "42%" or "18 units". */
  caption?: string;
  color?: string;
}

/** Horizontal magnitude bars with direct labels. One hue: the bars compare size, not identity. */
export function BarList({
  items,
  ariaLabel,
  color = CHART_COLORS[0],
  emptyText = 'No data yet',
}: {
  items: readonly BarListItem[];
  ariaLabel: string;
  color?: string;
  emptyText?: string;
}) {
  const max = Math.max(0, ...items.map((item) => item.value));
  if (items.length === 0 || max <= 0) return <p className="py-6 text-center text-[13px] text-ink-3">{emptyText}</p>;

  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-3.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate text-ink-2">{item.label}</span>
            <span className="shrink-0 font-bold tabular-nums text-ink">
              {item.valueLabel ?? item.value}
              {item.caption && <span className="ml-1.5 font-normal text-ink-3">{item.caption}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full rounded-r-sm bg-surface" aria-hidden="true">
            <div
              className="h-2 rounded-r-[4px] transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.max(item.value > 0 ? 1.5 : 0, (item.value / max) * 100)}%`, backgroundColor: item.color ?? color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default BarList;
