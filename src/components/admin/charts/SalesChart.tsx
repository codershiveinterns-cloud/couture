'use client';

import { useMemo, useState } from 'react';
import { formatPrice } from '@/lib/format';
import type { DailySales } from '@/lib/services/analytics';
import { AreaChart } from './AreaChart';
import { CHART_COLORS } from './chartUtils';

const DAY_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function dayLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return DAY_FORMAT.format(new Date(year, (month ?? 1) - 1, day ?? 1));
}

/**
 * Revenue (area) over orders (columns): two measures on different scales get two aligned panels
 * sharing one x-axis and one crosshair — never a dual y-axis.
 */
export function SalesChart({ daily, height = 220 }: { daily: readonly DailySales[]; height?: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const revenue = useMemo(() => daily.map((day) => ({ label: dayLabel(day.date), value: day.revenue })), [daily]);
  const orders = useMemo(() => daily.map((day) => ({ label: dayLabel(day.date), value: day.orders })), [daily]);
  const days = daily.length;

  return (
    <div>
      <ul className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-ink-2" aria-label="Legend">
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: CHART_COLORS[0] }} aria-hidden="true" />
          Revenue (top)
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: CHART_COLORS[1] }} aria-hidden="true" />
          Orders (bottom)
        </li>
      </ul>
      <AreaChart
        data={revenue}
        seriesLabel="Revenue"
        ariaLabel={`Revenue per day for the last ${days} days`}
        height={height}
        color={CHART_COLORS[0]}
        formatValue={formatPrice}
        formatTick={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : value}`}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        hideXAxis
      />
      <AreaChart
        data={orders}
        variant="bars"
        seriesLabel="Orders"
        ariaLabel={`Orders per day for the last ${days} days`}
        height={96}
        color={CHART_COLORS[1]}
        formatValue={(value) => String(value)}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
      />
    </div>
  );
}

export default SalesChart;
