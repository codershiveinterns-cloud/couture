'use client';

import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { CHART_COLORS, CHART_INK, compactNumber, niceTicks, useChartWidth } from './chartUtils';
import { SrTable } from './SrTable';

export interface SeriesPoint {
  /** Full label used in the tooltip and the data table, e.g. "Sep 14". */
  label: string;
  value: number;
}

export interface AreaChartProps {
  data: readonly SeriesPoint[];
  /** Names the single series (tooltip + table column), e.g. "Revenue". */
  seriesLabel: string;
  ariaLabel: string;
  /** 'area' = line with a soft fill (continuous measures); 'bars' = thin columns (counts). */
  variant?: 'area' | 'bars';
  color?: string;
  height?: number;
  formatValue?(value: number): string;
  formatTick?(value: number): string;
  /** Controlled hover index so stacked charts can share one crosshair. */
  activeIndex?: number | null;
  onActiveIndexChange?(index: number | null): void;
  /** Hide the x-axis labels (when another chart below shares the same axis). */
  hideXAxis?: boolean;
}

const MARGIN = { top: 12, right: 12, left: 46 };

/** Single-series time chart: one y-axis, recessive grid, crosshair + tooltip, keyboard navigable. */
export function AreaChart({
  data,
  seriesLabel,
  ariaLabel,
  variant = 'area',
  color = CHART_COLORS[0],
  height = 220,
  formatValue = String,
  formatTick = compactNumber,
  activeIndex,
  onActiveIndexChange,
  hideXAxis = false,
}: AreaChartProps) {
  const gradientId = useId();
  const [containerRef, width] = useChartWidth<HTMLDivElement>();
  const [localIndex, setLocalIndex] = useState<number | null>(null);
  const controlled = activeIndex !== undefined;
  const hovered = controlled ? activeIndex : localIndex;
  const setHovered = (index: number | null) => {
    if (!controlled) setLocalIndex(index);
    onActiveIndexChange?.(index);
  };

  const bottom = hideXAxis ? 8 : 26;
  const plotWidth = Math.max(40, width - MARGIN.left - MARGIN.right);
  const plotHeight = Math.max(40, height - MARGIN.top - bottom);
  const count = data.length;
  const band = count > 0 ? plotWidth / count : plotWidth;
  const ticks = niceTicks(Math.max(0, ...data.map((point) => point.value)), variant === 'bars' ? 2 : 4).filter(
    (tick) => variant !== 'bars' || Number.isInteger(tick),
  );
  const yMax = ticks[ticks.length - 1] || 1;
  const xAt = (index: number) => MARGIN.left + (index + 0.5) * band;
  const yAt = (value: number) => MARGIN.top + plotHeight - (value / yMax) * plotHeight;
  const baseline = MARGIN.top + plotHeight;

  const linePath = data.map((point, index) => `${index === 0 ? 'M' : 'L'}${xAt(index).toFixed(1)},${yAt(point.value).toFixed(1)}`).join(' ');
  const areaPath = count > 0 ? `${linePath} L${xAt(count - 1).toFixed(1)},${baseline} L${xAt(0).toFixed(1)},${baseline} Z` : '';
  const labelEvery = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(plotWidth / 58))));
  const barWidth = Math.max(3, Math.min(18, band - 2));

  const indexFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width - MARGIN.left;
    return Math.min(count - 1, Math.max(0, Math.floor(x / band)));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (count === 0) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const start = hovered ?? (delta === 1 ? -1 : count);
      setHovered(Math.min(count - 1, Math.max(0, start + delta)));
    } else if (event.key === 'Escape') {
      setHovered(null);
    }
  };

  const active = hovered !== null && hovered !== undefined && hovered < count ? data[hovered] : null;
  const activeX = active && hovered !== null && hovered !== undefined ? xAt(hovered) : 0;
  const tooltipLeft = Math.min(Math.max(activeX, 70), Math.max(70, width - 70));

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        tabIndex={0}
        onPointerMove={(event) => count > 0 && setHovered(indexFromPointer(event))}
        onPointerLeave={() => setHovered(null)}
        onBlur={() => setHovered(null)}
        onKeyDown={onKeyDown}
        className="block touch-pan-y rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke={tick === 0 ? CHART_INK.axis : CHART_INK.grid}
              strokeWidth="1"
            />
            <text x={MARGIN.left - 8} y={yAt(tick) + 4} textAnchor="end" fontSize="11" fill={CHART_INK.label}>
              {formatTick(tick)}
            </text>
          </g>
        ))}

        {variant === 'area' ? (
          <>
            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
            {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
          </>
        ) : (
          data.map((point, index) => {
            const barHeight = Math.max(point.value > 0 ? 2 : 0, baseline - yAt(point.value));
            const radius = Math.min(3, barHeight, barWidth / 2);
            const x = xAt(index) - barWidth / 2;
            const y = baseline - barHeight;
            return barHeight > 0 ? (
              <path
                key={index}
                d={`M${x},${baseline} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + barWidth - radius} Q${x + barWidth},${y} ${x + barWidth},${y + radius} V${baseline} Z`}
                fill={color}
                opacity={hovered === null || hovered === undefined || hovered === index ? 1 : 0.45}
              />
            ) : null;
          })
        )}

        {active && (
          <g pointerEvents="none">
            <line x1={activeX} x2={activeX} y1={MARGIN.top} y2={baseline} stroke={CHART_INK.muted} strokeWidth="1" strokeDasharray="3 3" />
            {variant === 'area' && <circle cx={activeX} cy={yAt(active.value)} r="4.5" fill={color} stroke="#fff" strokeWidth="2" />}
          </g>
        )}

        {!hideXAxis &&
          data.map((point, index) =>
            (count - 1 - index) % labelEvery === 0 ? (
              <text key={index} x={xAt(index)} y={height - 8} textAnchor="middle" fontSize="11" fill={CHART_INK.label}>
                {point.label}
              </text>
            ) : null,
          )}
      </svg>

      {active && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-sm border border-line bg-white px-2.5 py-1.5 text-[12px] shadow-[0_4px_12px_rgba(40,44,63,0.15)]"
          style={{ left: tooltipLeft }}
        >
          <p className="text-ink-3">{active.label}</p>
          <p className="mt-0.5 flex items-center gap-1.5 font-bold text-ink">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {seriesLabel}: {formatValue(active.value)}
          </p>
        </div>
      )}

      <SrTable caption={ariaLabel} columns={['Period', seriesLabel]} rows={data.map((point) => [point.label, formatValue(point.value)])} />
    </div>
  );
}

export default AreaChart;
