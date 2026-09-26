import { useEffect, useRef, useState, type RefObject } from 'react';

/** Validated categorical order (brand, indigo, teal) — assigned by entity, never by rank. */
export const CHART_COLORS = ['#ff3f6c', '#526cd0', '#14958f', '#ff905a', '#7e818c'] as const;
export const CHART_INK = { grid: '#eaeaec', axis: '#d4d5d9', label: '#7e818c', muted: '#94969f' } as const;

/** Rounds a maximum up to a "nice" axis bound and returns evenly spaced ticks from 0. */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude;
  const ticks: number[] = [];
  for (let value = 0; value < max + step - 1e-9; value += step) ticks.push(Number(value.toFixed(6)));
  return ticks;
}

/** Tracks the rendered width of a container so SVG text stays a constant size at every breakpoint. */
export function useChartWidth<T extends HTMLElement>(fallback = 720): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? 0);
      if (next > 0) setWidth((current) => (current === next ? current : next));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

export function compactNumber(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
