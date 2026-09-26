'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage } from '@/components/admin/AdminPage';
import { Button } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useAllOrders } from '@/hooks/useAllOrders';
import { formatPrice } from '@/lib/format';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from '@/lib/services/orders';
import type { AdminOrder, OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/services/types';
import {
  downloadCsv,
  FilterSelect,
  formatDate,
  formatDateTime,
  LINK_CLASS,
  OrderStatusPill,
  Pagination,
  PAYMENT_METHOD_SHORT,
  PaymentStatusPill,
  SearchBox,
  SortableTh,
  TableEmpty,
  TableSkeleton,
  type SortDir,
} from './shared';

const PAGE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

type StatusFilter = 'ALL' | OrderStatus;
type PaymentFilter = 'ALL' | PaymentStatus;
type MethodFilter = 'ALL' | PaymentMethod;
type RangeFilter = 'all' | '7' | '30';
type SortKey = 'orderNumber' | 'date' | 'customer' | 'items' | 'total';

const TAB_LABELS: Record<StatusFilter, string> = {
  ALL: 'All',
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};
const TABS: readonly StatusFilter[] = ['ALL', ...ORDER_STATUSES];

const PAYMENT_OPTIONS: readonly { value: PaymentFilter; label: string }[] = [
  { value: 'ALL', label: 'All payments' },
  ...PAYMENT_STATUSES.map((status) => ({ value: status, label: PAYMENT_STATUS_LABELS[status] })),
];
const METHOD_OPTIONS: readonly { value: MethodFilter; label: string }[] = [
  { value: 'ALL', label: 'All methods' },
  ...(['COD', 'CARD', 'UPI'] as const).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] })),
];
const RANGE_OPTIONS: readonly { value: RangeFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
];

const itemCount = (order: AdminOrder) => order.items.reduce((sum, item) => sum + item.quantity, 0);

function compareOrders(a: AdminOrder, b: AdminOrder, key: SortKey): number {
  switch (key) {
    case 'orderNumber':
      return a.orderNumber.localeCompare(b.orderNumber);
    case 'customer':
      return a.customer.name.localeCompare(b.customer.name);
    case 'items':
      return itemCount(a) - itemCount(b);
    case 'total':
      return a.totals.total - b.totals.total;
    case 'date':
      return a.createdAt.localeCompare(b.createdAt);
  }
}

export function OrdersView() {
  const { orders, isHydrated } = useAllOrders();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [payment, setPayment] = useState<PaymentFilter>('ALL');
  const [method, setMethod] = useState<MethodFilter>('ALL');
  const [range, setRange] = useState<RangeFilter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [now] = useState(() => Date.now());

  /** Everything except the status tab — the tab counts are computed from this. */
  const base = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const since = range === 'all' ? null : now - Number(range) * DAY_MS;
    return orders.filter((order) => {
      if (payment !== 'ALL' && order.paymentStatus !== payment) return false;
      if (method !== 'ALL' && order.paymentMethod !== method) return false;
      if (since !== null && new Date(order.createdAt).getTime() < since) return false;
      if (!needle) return true;
      return (
        order.orderNumber.toLowerCase().includes(needle) ||
        order.customer.name.toLowerCase().includes(needle) ||
        order.customer.email.toLowerCase().includes(needle)
      );
    });
  }, [orders, search, payment, method, range, now]);

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>([['ALL', base.length]]);
    for (const order of base) map.set(order.status, (map.get(order.status) ?? 0) + 1);
    return map;
  }, [base]);

  const filtered = useMemo(() => {
    const list = status === 'ALL' ? [...base] : base.filter((order) => order.status === status);
    const factor = sort.dir === 'asc' ? 1 : -1;
    return list.sort((a, b) => compareOrders(a, b, sort.key) * factor);
  }, [base, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const toggleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'customer' || key === 'orderNumber' ? 'asc' : 'desc' },
    );
    setPage(1);
  };

  const hasFilters = search.trim() !== '' || status !== 'ALL' || payment !== 'ALL' || method !== 'ALL' || range !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPayment('ALL');
    setMethod('ALL');
    setRange('all');
    setPage(1);
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.info('There are no orders to export');
      return;
    }
    downloadCsv(`couture-orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      [
        'Order number',
        'Placed at',
        'Customer',
        'Email',
        'Items',
        'Subtotal',
        'Discount',
        'Shipping',
        'Tax',
        'Total',
        'Coupon',
        'Payment method',
        'Payment status',
        'Order status',
        'Carrier',
        'Tracking number',
        'City',
        'Country',
      ],
      ...filtered.map((order) => [
        order.orderNumber,
        order.createdAt,
        order.customer.name,
        order.customer.email,
        itemCount(order),
        order.totals.subtotal.toFixed(2),
        order.totals.discount.toFixed(2),
        order.totals.shipping.toFixed(2),
        order.totals.tax.toFixed(2),
        order.totals.total.toFixed(2),
        order.couponCode,
        PAYMENT_METHOD_LABELS[order.paymentMethod],
        PAYMENT_STATUS_LABELS[order.paymentStatus],
        ORDER_STATUS_LABELS[order.status],
        order.trackingCarrier,
        order.trackingNumber,
        order.address.city,
        order.address.country,
      ]),
    ]);
    toast.success(`Exported ${filtered.length} order${filtered.length === 1 ? '' : 's'}`);
  };

  const sortProps = (key: SortKey) => ({
    active: sort.key === key,
    dir: sort.dir,
    onSort: () => toggleSort(key),
  });

  return (
    <AdminPage
      title="Orders"
      description="Search, filter and fulfil every order placed on the store."
      actions={
        <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!isHydrated}>
          Export CSV
        </Button>
      }
    >
      <AdminCard padded={false}>
        <div role="tablist" aria-label="Filter by order status" className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-2">
          {TABS.map((tab) => {
            const selected = status === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => withReset(setStatus)(tab)}
                className={`-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  selected ? 'border-brand text-brand' : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                {TAB_LABELS[tab]}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${
                    selected ? 'bg-brand-light text-brand' : 'bg-surface text-ink-3'
                  }`}
                >
                  {isHydrated ? (counts.get(tab) ?? 0) : '–'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3">
          <SearchBox
            id="orders-search"
            label="Search orders"
            placeholder="Search order #, customer name or email"
            value={search}
            onChange={withReset(setSearch)}
            className="w-full sm:w-auto sm:flex-1 sm:basis-64"
          />
          <FilterSelect id="orders-payment" label="Payment" value={payment} onChange={withReset(setPayment)} options={PAYMENT_OPTIONS} />
          <FilterSelect id="orders-method" label="Method" value={method} onChange={withReset(setMethod)} options={METHOD_OPTIONS} />
          <FilterSelect id="orders-range" label="Date" value={range} onChange={withReset(setRange)} options={RANGE_OPTIONS} />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        {!isHydrated ? (
          <TableSkeleton rows={8} />
        ) : (
          <>
            <div className={ADMIN_TABLE.wrap}>
              <table className={`${ADMIN_TABLE.table} min-w-[920px]`}>
                <caption className="sr-only">Orders</caption>
                <thead>
                  <tr>
                    <SortableTh label="Order #" {...sortProps('orderNumber')} />
                    <SortableTh label="Date" {...sortProps('date')} />
                    <SortableTh label="Customer" {...sortProps('customer')} />
                    <SortableTh label="Items" align="right" {...sortProps('items')} />
                    <SortableTh label="Total" align="right" {...sortProps('total')} />
                    <th scope="col" className={ADMIN_TABLE.th}>
                      Payment
                    </th>
                    <th scope="col" className={ADMIN_TABLE.th}>
                      Status
                    </th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <TableEmpty colSpan={8}>
                      {orders.length === 0 ? 'No orders have been placed yet.' : 'No orders match these filters.'}
                    </TableEmpty>
                  ) : (
                    visible.map((order) => {
                      const href = `/admin/orders/${encodeURIComponent(order.orderNumber)}`;
                      return (
                        <tr key={order.id} className={ADMIN_TABLE.row}>
                          <th scope="row" className={`${ADMIN_TABLE.td} whitespace-nowrap font-normal`}>
                            <Link href={href} className={LINK_CLASS}>
                              {order.orderNumber}
                            </Link>
                          </th>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap`} title={formatDateTime(order.createdAt)}>
                            {formatDate(order.createdAt)}
                          </td>
                          <td className={ADMIN_TABLE.td}>
                            <Link href={`/admin/customers/${encodeURIComponent(order.customer.id)}`} className={LINK_CLASS}>
                              {order.customer.name}
                            </Link>
                            <div className="text-[12px] text-ink-3">{order.customer.email}</div>
                          </td>
                          <td className={`${ADMIN_TABLE.td} text-right tabular-nums`}>{itemCount(order)}</td>
                          <td className={`${ADMIN_TABLE.td} text-right font-bold text-ink tabular-nums`}>
                            {formatPrice(order.totals.total)}
                          </td>
                          <td className={ADMIN_TABLE.td}>
                            <div className="flex items-center gap-2">
                              <PaymentStatusPill status={order.paymentStatus} />
                              <span className="text-[12px] text-ink-3" title={PAYMENT_METHOD_LABELS[order.paymentMethod]}>
                                {PAYMENT_METHOD_SHORT[order.paymentMethod]}
                              </span>
                            </div>
                          </td>
                          <td className={ADMIN_TABLE.td}>
                            <OrderStatusPill status={order.status} />
                          </td>
                          <td className={`${ADMIN_TABLE.td} text-right`}>
                            <Button href={href} variant="secondary" size="sm" aria-label={`View order ${order.orderNumber}`}>
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPage={setPage}
              noun="orders"
            />
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}

export default OrdersView;
