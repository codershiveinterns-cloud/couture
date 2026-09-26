'use client';

import { useState } from 'react';
import { CHART_COLORS } from './chartUtils';
import { SrTable } from './SrTable';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** Text for the legend row, e.g. "$1,240.00". Defaults to the raw value. */
  valueLabel?: string;
  /** Fixed colour for this entity (falls back to the categorical order by position). */
  color?: string;
}

const SIZE = 160;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

/** Part-to-whole ring for a handful of categories. The legend carries labels + values, so colour is never alone. */
export function Donut({
  slices,
  ariaLabel,
  centerLabel,
  centerValue,
  emptyText = 'No data yet',
}: {
  slices: readonly DonutSlice[];
  ariaLabel: string;
  centerLabel: string;
  centerValue: string;
  emptyText?: string;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const colored = slices.map((slice, index) => ({ ...slice, color: slice.color ?? CHART_COLORS[index % CHART_COLORS.length] }));

  if (total <= 0) return <p className="py-6 text-center text-[13px] text-ink-3">{emptyText}</p>;

  const visible = colored.filter((slice) => slice.value > 0);
  const gap = visible.length > 1 ? GAP : 0;
  const arcs = visible.map((slice, index) => {
    const before = visible.slice(0, index).reduce((sum, item) => sum + item.value, 0);
    return {
      ...slice,
      length: Math.max(0.5, (slice.value / total) * CIRCUMFERENCE - gap),
      offset: (before / total) * CIRCUMFERENCE,
    };
  });
  const active = colored.find((slice) => slice.key === activeKey) ?? null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="block -rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#f5f5f6" strokeWidth={STROKE} />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={-arc.offset}
              opacity={activeKey === null || activeKey === arc.key ? 1 : 0.35}
              onPointerEnter={() => setActiveKey(arc.key)}
              onPointerLeave={() => setActiveKey(null)}
              className="transition-opacity duration-150"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
          <span className="text-[16px] font-bold leading-tight text-ink">
            {active ? `${Math.round((active.value / total) * 100)}%` : centerValue}
          </span>
          <span className="mt-0.5 max-w-[92px] truncate text-[11px] uppercase tracking-wide text-ink-3">{active ? active.label : centerLabel}</span>
        </div>
      </div>

      <ul className="flex w-full min-w-0 flex-col gap-2.5">
        {colored.map((slice) => (
          <li
            key={slice.key}
            onPointerEnter={() => setActiveKey(slice.key)}
            onPointerLeave={() => setActiveKey(null)}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="flex min-w-0 items-center gap-2 text-ink-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden="true" />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums text-ink">
              {slice.valueLabel ?? slice.value}
              <span className="ml-1.5 font-normal text-ink-3">{Math.round((slice.value / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>

      <SrTable
        caption={ariaLabel}
        columns={['Segment', 'Value', 'Share']}
        rows={colored.map((slice) => [slice.label, slice.valueLabel ?? slice.value, `${Math.round((slice.value / total) * 100)}%`])}
      />
    </div>
  );
}

export default Donut;
