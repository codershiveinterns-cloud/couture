'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage, StatusPill } from '@/components/admin/AdminPage';
import { BarList, Donut, SalesChart } from '@/components/admin/charts';
import { Button, Modal } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useDashboard } from '@/hooks/useAnalytics';
import { formatPrice } from '@/lib/format';
import { resetDemoData, seedDemoActivity } from '@/lib/services/analytics';
import { ADMIN_LOGIN_PATH } from '@/lib/services/auth';
import { productStockLevel, totalStock } from '@/lib/services/catalogStore';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/services/orders';
import { KpiTile, KpiTileSkeleton, halfOverHalfTrend } from './KpiTile';
import { ProductThumb } from './ProductThumb';
import { ORDER_STATUS_TONES, PAYMENT_STATUS_TONES } from './statusTones';

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const LINK = 'font-bold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-sm';

function TileIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`text-[12px] uppercase tracking-wide ${LINK}`}>
      {children}
    </Link>
  );
}

function SkeletonBlock({ height }: { height: number }) {
  return <div className="w-full animate-pulse rounded-sm bg-surface" style={{ height }} aria-hidden="true" />;
}

export function DashboardView() {
  const router = useRouter();
  const { stats, daily, bestSellers, byPaymentMethod, isHydrated } = useDashboard({ days: 14, bestSellerLimit: 5 });
  const [confirmReset, setConfirmReset] = useState(false);

  // Seeds demo customers + orders the first time an admin lands here (no-op once any order exists).
  useEffect(() => {
    seedDemoActivity();
  }, []);

  const handleReset = () => {
    setConfirmReset(false);
    resetDemoData();
    toast.success('Demo data reset. Sign in again to continue.');
    router.replace(ADMIN_LOGIN_PATH);
  };

  const revenueTrend = halfOverHalfTrend(daily.map((day) => day.revenue));
  const ordersTrend = halfOverHalfTrend(daily.map((day) => day.orders));
  const lowStockTotal = stats.lowStock.length;
  const periodRevenue = daily.reduce((sum, day) => sum + day.revenue, 0);
  const periodOrders = daily.reduce((sum, day) => sum + day.orders, 0);

  return (
    <AdminPage
      title="Dashboard"
      description="How the store is doing today."
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
            Reset demo data
          </Button>
          <Button size="sm" href="/admin/products/new">
            Add product
          </Button>
        </>
      }
    >
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {!isHydrated ? (
          Array.from({ length: 8 }, (_, index) => <KpiTileSkeleton key={index} />)
        ) : (
          <>
            <KpiTile
              label="Total sales"
              value={formatPrice(stats.totalSales)}
              caption={revenueTrend.caption}
              trend={revenueTrend.direction}
              href="/admin/analytics"
              icon={<TileIcon><path d="M12 2v20M17 6.5C17 4.6 14.8 4 12 4S7 5 7 7.5 9.5 11 12 12s5 1.5 5 4.5S14.8 20 12 20s-5-.6-5-2.5" /></TileIcon>}
            />
            <KpiTile
              label="Orders"
              value={String(stats.orderCount)}
              caption={ordersTrend.caption}
              trend={ordersTrend.direction}
              href="/admin/orders"
              icon={<TileIcon><path d="M6 2h12l2 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6l2-4zM4 6h16" /></TileIcon>}
            />
            <KpiTile
              label="Customers"
              value={String(stats.customerCount)}
              caption={stats.recentCustomers[0] ? `Latest: ${stats.recentCustomers[0].name}` : 'No registrations yet'}
              href="/admin/customers"
              icon={<TileIcon><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></TileIcon>}
            />
            <KpiTile
              label="Products"
              value={String(stats.productCount)}
              caption={`${stats.publishedProductCount} published · ${stats.productCount - stats.publishedProductCount} draft`}
              href="/admin/products"
              icon={<TileIcon><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8" /></TileIcon>}
            />
            <KpiTile
              label="Pending orders"
              value={String(stats.pendingOrders)}
              caption={stats.pendingOrders > 0 ? 'Open — awaiting fulfilment' : 'All caught up'}
              attention={stats.pendingOrders > 0}
              href="/admin/orders"
              icon={<TileIcon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></TileIcon>}
            />
            <KpiTile
              label="Completed orders"
              value={String(stats.completedOrders)}
              caption={`${stats.cancelledOrders} cancelled · ${stats.refundedOrders} refunded`}
              href="/admin/orders"
              icon={<TileIcon><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></TileIcon>}
            />
            <KpiTile
              label="Average order value"
              value={formatPrice(stats.averageOrderValue)}
              caption="Excludes cancelled & refunded"
              icon={<TileIcon><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></TileIcon>}
            />
            <KpiTile
              label="Low-stock items"
              value={String(lowStockTotal)}
              caption={stats.outOfStockCount > 0 ? `${stats.outOfStockCount} out of stock` : 'Nothing out of stock'}
              attention={lowStockTotal > 0 || stats.outOfStockCount > 0}
              href="/admin/inventory"
              icon={<TileIcon><path d="M12 3l10 18H2L12 3zM12 10v5M12 18h.01" /></TileIcon>}
            />
          </>
        )}
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AdminCard
          title="Sales overview"
          className="min-w-0 xl:col-span-2"
          aside={
            <span className="text-[12px] text-ink-3">
              Last 14 days{isHydrated && ` · ${formatPrice(periodRevenue)} · ${periodOrders} orders`}
            </span>
          }
        >
          {isHydrated ? <SalesChart daily={daily} /> : <SkeletonBlock height={340} />}
        </AdminCard>

        <AdminCard title="Payment methods" className="min-w-0">
          {isHydrated ? (
            <Donut
              ariaLabel="Share of revenue by payment method"
              centerLabel="Revenue"
              centerValue={formatPrice(stats.totalSales)}
              slices={byPaymentMethod.map((share) => ({
                key: share.method,
                label: PAYMENT_METHOD_LABELS[share.method],
                value: share.revenue,
                valueLabel: formatPrice(share.revenue),
              }))}
              emptyText="No paid orders yet"
            />
          ) : (
            <SkeletonBlock height={160} />
          )}
        </AdminCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AdminCard title="Recent orders" padded={false} className="min-w-0 xl:col-span-2" aside={<CardLink href="/admin/orders">View all</CardLink>}>
          {!isHydrated ? (
            <div className="p-5">
              <SkeletonBlock height={220} />
            </div>
          ) : stats.recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-3">No orders yet.</p>
          ) : (
            <div className={ADMIN_TABLE.wrap}>
              <table className={ADMIN_TABLE.table}>
                <thead>
                  <tr>
                    <th scope="col" className={ADMIN_TABLE.th}>Order</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Customer</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Date</th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>Total</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Payment</th>
                    <th scope="col" className={ADMIN_TABLE.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className={ADMIN_TABLE.row}>
                      <th scope="row" className={`${ADMIN_TABLE.td} whitespace-nowrap font-normal`}>
                        <Link href={`/admin/orders/${order.orderNumber}`} className={LINK}>
                          {order.orderNumber}
                        </Link>
                      </th>
                      <td className={ADMIN_TABLE.td}>
                        <span className="block max-w-[200px] truncate text-ink">{order.customer.name}</span>
                        <span className="block max-w-[200px] truncate text-[12px] text-ink-3">{order.customer.email}</span>
                      </td>
                      <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>{DATE_FORMAT.format(new Date(order.createdAt))}</td>
                      <td className={`${ADMIN_TABLE.td} whitespace-nowrap text-right font-bold tabular-nums text-ink`}>{formatPrice(order.totals.total)}</td>
                      <td className={ADMIN_TABLE.td}>
                        <StatusPill tone={PAYMENT_STATUS_TONES[order.paymentStatus]}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</StatusPill>
                        <span className="mt-1 block text-[12px] text-ink-3">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
                      </td>
                      <td className={ADMIN_TABLE.td}>
                        <StatusPill tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard title="Low stock" padded={false} className="min-w-0" aside={<CardLink href="/admin/inventory">Manage inventory</CardLink>}>
          {!isHydrated ? (
            <div className="p-5">
              <SkeletonBlock height={220} />
            </div>
          ) : lowStockTotal + stats.outOfStockCount === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-3">Every product is well stocked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {[...stats.outOfStock, ...stats.lowStock].slice(0, 6).map((product) => {
                const out = productStockLevel(product) === 'out_of_stock';
                return (
                  <li key={product.id} className="flex items-center gap-3 px-5 py-3">
                    <ProductThumb url={product.images[0]?.url} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/products/${product.id}`} className="block truncate text-[14px] text-ink hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                        {product.name}
                      </Link>
                      <p className="truncate text-[12px] text-ink-3">{product.sku}</p>
                    </div>
                    <StatusPill tone={out ? 'danger' : 'warning'}>{out ? 'Out of stock' : `${totalStock(product)} left`}</StatusPill>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminCard title="Best sellers" className="min-w-0" aside={<CardLink href="/admin/analytics">Analytics</CardLink>}>
          {isHydrated ? (
            <BarList
              ariaLabel="Best-selling products by units sold"
              emptyText="No sales yet"
              items={bestSellers.map((item) => ({
                key: item.productId,
                label: item.name,
                value: item.units,
                valueLabel: `${item.units} sold`,
                caption: formatPrice(item.revenue),
              }))}
            />
          ) : (
            <SkeletonBlock height={200} />
          )}
        </AdminCard>

        <AdminCard title="Recent customers" padded={false} className="min-w-0" aside={<CardLink href="/admin/customers">View all</CardLink>}>
          {!isHydrated ? (
            <div className="p-5">
              <SkeletonBlock height={200} />
            </div>
          ) : stats.recentCustomers.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-3">No customers yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentCustomers.map((customer) => (
                <li key={customer.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-[13px] font-bold text-ink-2" aria-hidden="true">
                    {(customer.name.trim()[0] ?? '?').toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/customers/${customer.id}`} className="block truncate text-[14px] text-ink hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                      {customer.name}
                    </Link>
                    <p className="truncate text-[12px] text-ink-3">{customer.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-bold tabular-nums text-ink">{formatPrice(customer.totalSpent)}</p>
                    <p className="text-[12px] text-ink-3">
                      {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                    </p>
                  </div>
                  {customer.status === 'blocked' && <StatusPill tone="danger">Blocked</StatusPill>}
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        description="This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Keep data
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-[14px] text-ink-2">
          Every order, payment, customer account, coupon change, review and catalogue edit stored in this browser will be erased, and you will be
          signed out. The demo admin account and sample activity are recreated the next time you sign in.
        </p>
      </Modal>
    </AdminPage>
  );
}

export default DashboardView;
