'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage, StatusPill } from '@/components/admin/AdminPage';
import { BarList, Donut, SalesChart } from '@/components/admin/charts';
import { KpiTile, KpiTileSkeleton, halfOverHalfTrend } from '@/components/admin/dashboard/KpiTile';
import { ProductThumb } from '@/components/admin/dashboard/ProductThumb';
import { ORDER_STATUS_TONES } from '@/components/admin/dashboard/statusTones';
import { useAnalyticsSource } from '@/hooks/useAnalytics';
import { formatPrice } from '@/lib/format';
import {
  bestSellers as computeBestSellers,
  getDashboardStats,
  orderStatusSplit,
  paymentMethodSplit,
  salesByCategory,
  salesByDay,
} from '@/lib/services/analytics';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/services/orders';

const PERIODS = [7, 14, 30] as const;
type Period = (typeof PERIODS)[number];

function SkeletonBlock({ height }: { height: number }) {
  return <div className="w-full animate-pulse rounded-sm bg-surface" style={{ height }} aria-hidden="true" />;
}

export function AnalyticsView() {
  const [period, setPeriod] = useState<Period>(14);
  const { source, isHydrated } = useAnalyticsSource();

  // Every panel follows the selected period: orders are restricted to the same local-day window
  // salesByDay uses (today and the previous period-1 days) before the analytics functions run.
  const { stats, daily, bestSellers, byCategory, byPaymentMethod, byStatus } = useMemo(() => {
    const today = new Date();
    const windowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (period - 1)).getTime();
    const periodSource = { ...source, orders: source.orders.filter((order) => new Date(order.createdAt).getTime() >= windowStart) };
    return {
      stats: getDashboardStats(source),
      daily: salesByDay(period, source),
      bestSellers: computeBestSellers(10, periodSource),
      byCategory: salesByCategory(periodSource),
      byPaymentMethod: paymentMethodSplit(periodSource),
      byStatus: orderStatusSplit(periodSource),
    };
  }, [source, period]);
  const periodLabel = `Last ${period} days`;

  const periodRevenue = daily.reduce((sum, day) => sum + day.revenue, 0);
  const periodOrders = daily.reduce((sum, day) => sum + day.orders, 0);
  const periodAov = periodOrders > 0 ? periodRevenue / periodOrders : 0;
  const revenueTrend = halfOverHalfTrend(daily.map((day) => day.revenue));
  const ordersTrend = halfOverHalfTrend(daily.map((day) => day.orders));
  const statusTotal = byStatus.reduce((sum, row) => sum + row.count, 0);

  return (
    <AdminPage
      title="Analytics"
      description="Sales performance, best sellers and payment mix."
      actions={
        <div role="group" aria-label="Reporting period" className="inline-flex overflow-hidden rounded-sm border border-line-strong bg-white">
          {PERIODS.map((days) => (
            <button
              key={days}
              type="button"
              aria-pressed={period === days}
              onClick={() => setPeriod(days)}
              className={`h-9 border-l border-line-strong px-3.5 text-[12px] font-bold uppercase tracking-wide transition-colors first:border-l-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 ${
                period === days ? 'bg-brand text-white' : 'text-ink-2 hover:bg-surface hover:text-ink'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      }
    >
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {!isHydrated ? (
          Array.from({ length: 4 }, (_, index) => <KpiTileSkeleton key={index} />)
        ) : (
          <>
            <KpiTile label={`Revenue · ${period} days`} value={formatPrice(periodRevenue)} caption={revenueTrend.caption} trend={revenueTrend.direction} />
            <KpiTile label={`Orders · ${period} days`} value={String(periodOrders)} caption={ordersTrend.caption} trend={ordersTrend.direction} />
            <KpiTile label="Average order value" value={formatPrice(periodAov)} caption={`All time: ${formatPrice(stats.averageOrderValue)}`} />
            <KpiTile label="Customers" value={String(stats.customerCount)} caption={`${formatPrice(stats.totalSales)} lifetime sales`} href="/admin/customers" />
          </>
        )}
      </section>

      <AdminCard title="Revenue & orders" className="mt-4 min-w-0" aside={<span className="text-[12px] text-ink-3">Last {period} days · cancelled and refunded orders excluded</span>}>
        {isHydrated ? <SalesChart daily={daily} height={240} /> : <SkeletonBlock height={360} />}
      </AdminCard>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AdminCard title="Best-selling products" padded={false} className="min-w-0 xl:col-span-2" aside={<span className="text-[12px] text-ink-3">{periodLabel}</span>}>
          {!isHydrated ? (
            <div className="p-5">
              <SkeletonBlock height={260} />
            </div>
          ) : bestSellers.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-3">No sales in the last {period} days.</p>
          ) : (
            <div className={ADMIN_TABLE.wrap}>
              <table className={`${ADMIN_TABLE.table} min-w-[520px]`}>
                <thead>
                  <tr>
                    <th scope="col" className={`${ADMIN_TABLE.th} w-10`}>#</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Product</th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>Units</th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.map((item, index) => (
                    <tr key={item.productId} className={ADMIN_TABLE.row}>
                      <td className={`${ADMIN_TABLE.td} tabular-nums text-ink-3`}>{index + 1}</td>
                      <th scope="row" className={`${ADMIN_TABLE.td} font-normal`}>
                        <span className="flex items-center gap-3">
                          <ProductThumb url={item.image} size={36} />
                          <Link
                            href={`/admin/products/${item.productId}`}
                            className="min-w-0 truncate text-ink hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                          >
                            {item.name}
                          </Link>
                        </span>
                      </th>
                      <td className={`${ADMIN_TABLE.td} text-right tabular-nums`}>{item.units}</td>
                      <td className={`${ADMIN_TABLE.td} text-right font-bold tabular-nums text-ink`}>{formatPrice(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard title="Payment methods" className="min-w-0" aside={<span className="text-[12px] text-ink-3">By revenue · {periodLabel.toLowerCase()}</span>}>
          {isHydrated ? (
            <>
              <Donut
                ariaLabel="Share of revenue by payment method"
                centerLabel="Revenue"
                centerValue={formatPrice(periodRevenue)}
                emptyText={`No orders in the last ${period} days`}
                slices={byPaymentMethod.map((share) => ({
                  key: share.method,
                  label: PAYMENT_METHOD_LABELS[share.method],
                  value: share.revenue,
                  valueLabel: formatPrice(share.revenue),
                }))}
              />
              <p className="mt-4 border-t border-line pt-3 text-[12px] text-ink-3">
                {byPaymentMethod.map((share) => `${PAYMENT_METHOD_LABELS[share.method]}: ${share.orders} orders`).join(' · ')}
              </p>
            </>
          ) : (
            <SkeletonBlock height={200} />
          )}
        </AdminCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminCard title="Sales by category" className="min-w-0" aside={<span className="text-[12px] text-ink-3">Revenue · {periodLabel.toLowerCase()}</span>}>
          {isHydrated ? (
            <BarList
              ariaLabel="Revenue by category"
              emptyText={`No sales in the last ${period} days`}
              items={byCategory.map((category) => ({
                key: category.categoryId ?? `uncategorised-${category.name}`,
                label: category.name,
                value: category.revenue,
                valueLabel: formatPrice(category.revenue),
                caption: `${Math.round(category.percent)}% · ${category.units} units`,
              }))}
            />
          ) : (
            <SkeletonBlock height={220} />
          )}
        </AdminCard>

        <AdminCard title="Order status" className="min-w-0" aside={<span className="text-[12px] text-ink-3">{isHydrated ? `${statusTotal} orders · ${periodLabel.toLowerCase()}` : ''}</span>}>
          {!isHydrated ? (
            <SkeletonBlock height={220} />
          ) : statusTotal === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-3">No orders in the last {period} days</p>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Orders by status">
              {byStatus.map((row) => (
                <li key={row.status} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3">
                  <span>
                    <StatusPill tone={ORDER_STATUS_TONES[row.status]}>{ORDER_STATUS_LABELS[row.status]}</StatusPill>
                  </span>
                  <span className="h-2 rounded-r-sm bg-surface" aria-hidden="true">
                    <span className="block h-2 rounded-r-[4px] bg-ink-3" style={{ width: `${(row.count / statusTotal) * 100}%` }} />
                  </span>
                  <span className="w-16 text-right text-[13px] font-bold tabular-nums text-ink">
                    {row.count}
                    <span className="ml-1.5 font-normal text-ink-3">{Math.round((row.count / statusTotal) * 100)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </AdminPage>
  );
}

export default AnalyticsView;
