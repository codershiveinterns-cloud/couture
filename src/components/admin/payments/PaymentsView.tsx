'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage } from '@/components/admin/AdminPage';
import {
  FilterSelect,
  formatDateTime,
  LINK_CLASS,
  Pagination,
  PaymentStatusPill,
  SearchBox,
  StatTile,
  TableEmpty,
  TableSkeleton,
} from '@/components/admin/orders/shared';
import { Button } from '@/components/ui';
import { useAllOrders, usePayments } from '@/hooks/useAllOrders';
import { useCustomers } from '@/hooks/useCustomers';
import { formatPrice } from '@/lib/format';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from '@/lib/services/orders';
import { describePaymentInstrument } from '@/lib/services/payments';
import type { PaymentMethod, PaymentStatus } from '@/lib/services/types';

const PAGE_SIZE = 10;

type StatusFilter = 'ALL' | PaymentStatus;
type MethodFilter = 'ALL' | PaymentMethod;

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  ...PAYMENT_STATUSES.map((status) => ({ value: status, label: PAYMENT_STATUS_LABELS[status] })),
];
const METHOD_OPTIONS: readonly { value: MethodFilter; label: string }[] = [
  { value: 'ALL', label: 'All methods' },
  ...(['COD', 'CARD', 'UPI'] as const).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] })),
];

export function PaymentsView() {
  const { payments, isHydrated } = usePayments();
  const { orders } = useAllOrders();
  const { customers } = useCustomers();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [method, setMethod] = useState<MethodFilter>('ALL');
  const [page, setPage] = useState(1);

  const orderNumbers = useMemo(() => new Set(orders.map((order) => order.orderNumber)), [orders]);
  const customerById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const orderCustomerById = useMemo(() => new Map(orders.map((order) => [order.userId, order.customer])), [orders]);

  const summary = useMemo(() => {
    const totals = { collected: 0, pendingCod: 0, failed: 0, refunded: 0, failedCount: 0 };
    for (const payment of payments) {
      if (payment.status === 'PAID') totals.collected += payment.amount;
      else if (payment.status === 'PENDING' && payment.method === 'COD') totals.pendingCod += payment.amount;
      else if (payment.status === 'FAILED') {
        totals.failed += payment.amount;
        totals.failedCount += 1;
      } else if (payment.status === 'REFUNDED') totals.refunded += payment.amount;
    }
    return totals;
  }, [payments]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return payments.filter((payment) => {
      if (status !== 'ALL' && payment.status !== status) return false;
      if (method !== 'ALL' && payment.method !== method) return false;
      if (!needle) return true;
      const customer = customerById.get(payment.userId) ?? orderCustomerById.get(payment.userId);
      return (
        payment.reference.toLowerCase().includes(needle) ||
        payment.orderNumber.toLowerCase().includes(needle) ||
        (customer?.name.toLowerCase().includes(needle) ?? false) ||
        (customer?.email.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [payments, search, status, method, customerById, orderCustomerById]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };
  const hasFilters = search.trim() !== '' || status !== 'ALL' || method !== 'ALL';

  return (
    <AdminPage title="Payments" description="Every payment attempt across card, UPI and cash on delivery — including failed ones.">
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Collected" value={isHydrated ? formatPrice(summary.collected) : '—'} hint="Paid payments" />
        <StatTile label="Pending COD" value={isHydrated ? formatPrice(summary.pendingCod) : '—'} hint="To collect on delivery" />
        <StatTile
          label="Failed"
          value={isHydrated ? formatPrice(summary.failed) : '—'}
          hint={isHydrated ? `${summary.failedCount} attempt${summary.failedCount === 1 ? '' : 's'}` : undefined}
        />
        <StatTile label="Refunded" value={isHydrated ? formatPrice(summary.refunded) : '—'} hint="Returned to customers" />
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3">
          <SearchBox
            id="payments-search"
            label="Search payments"
            placeholder="Search reference, order # or customer"
            value={search}
            onChange={withReset(setSearch)}
            className="w-full sm:w-auto sm:flex-1 sm:basis-64"
          />
          <FilterSelect id="payments-status" label="Status" value={status} onChange={withReset(setStatus)} options={STATUS_OPTIONS} />
          <FilterSelect id="payments-method" label="Method" value={method} onChange={withReset(setMethod)} options={METHOD_OPTIONS} />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('ALL');
                setMethod('ALL');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {!isHydrated ? (
          <TableSkeleton rows={8} />
        ) : (
          <>
            <div className={ADMIN_TABLE.wrap}>
              <table className={`${ADMIN_TABLE.table} min-w-[980px]`}>
                <caption className="sr-only">Payment records</caption>
                <thead>
                  <tr>
                    {['Reference', 'Order #', 'Customer', 'Method'].map((heading) => (
                      <th key={heading} scope="col" className={ADMIN_TABLE.th}>
                        {heading}
                      </th>
                    ))}
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Amount
                    </th>
                    {['Status', 'Gateway', 'Date'].map((heading) => (
                      <th key={heading} scope="col" className={ADMIN_TABLE.th}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <TableEmpty colSpan={8}>
                      {payments.length === 0 ? 'No payments have been recorded yet.' : 'No payments match these filters.'}
                    </TableEmpty>
                  ) : (
                    visible.map((payment) => {
                      const customer = customerById.get(payment.userId) ?? orderCustomerById.get(payment.userId);
                      const hasOrder = orderNumbers.has(payment.orderNumber);
                      return (
                        <tr key={payment.id} className={ADMIN_TABLE.row}>
                          <th scope="row" className={`${ADMIN_TABLE.td} whitespace-nowrap font-mono text-[12px] font-normal text-ink`}>
                            {payment.reference}
                          </th>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>
                            {hasOrder ? (
                              <Link href={`/admin/orders/${encodeURIComponent(payment.orderNumber)}`} className={LINK_CLASS}>
                                {payment.orderNumber}
                              </Link>
                            ) : (
                              <span className="text-ink-3" title={`Attempted as ${payment.orderNumber}`}>
                                No order created
                              </span>
                            )}
                          </td>
                          <td className={ADMIN_TABLE.td}>
                            {customer ? (
                              <>
                                <Link href={`/admin/customers/${encodeURIComponent(customer.id)}`} className={LINK_CLASS}>
                                  {customer.name}
                                </Link>
                                <div className="text-[12px] text-ink-3">{customer.email}</div>
                              </>
                            ) : (
                              <span className="text-ink-3">Unknown customer</span>
                            )}
                          </td>
                          <td className={ADMIN_TABLE.td}>
                            <div className="whitespace-nowrap text-ink">{PAYMENT_METHOD_LABELS[payment.method]}</div>
                            {payment.method !== 'COD' && (
                              <div className="whitespace-nowrap text-[12px] text-ink-3">{describePaymentInstrument(payment)}</div>
                            )}
                          </td>
                          <td className={`${ADMIN_TABLE.td} text-right font-bold text-ink tabular-nums`}>{formatPrice(payment.amount)}</td>
                          <td className={ADMIN_TABLE.td}>
                            <PaymentStatusPill status={payment.status} />
                            {payment.failureReason && <div className="mt-1 max-w-[220px] text-[12px] text-brand">{payment.failureReason}</div>}
                          </td>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap text-[13px]`}>{payment.gateway}</td>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>{formatDateTime(payment.createdAt)}</td>
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
              noun="payments"
            />
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}

export default PaymentsView;
