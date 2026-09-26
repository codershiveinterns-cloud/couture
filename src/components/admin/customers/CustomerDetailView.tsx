'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage, StatusPill } from '@/components/admin/AdminPage';
import {
  Avatar,
  formatDate,
  formatDateTime,
  LINK_CLASS,
  OrderStatusPill,
  PaymentStatusPill,
  StatTile,
  TableEmpty,
} from '@/components/admin/orders/shared';
import { Button, EmptyState, Modal } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useCustomer } from '@/hooks/useCustomers';
import { formatPrice } from '@/lib/format';
import { setCustomerStatus } from '@/lib/services/customers';
import { CustomerStatusPill } from './CustomersView';

export function CustomerDetailView({ id }: { id: string }) {
  const { customer, isHydrated } = useCustomer(id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const backLink = (
    <Button href="/admin/customers" variant="secondary" size="sm">
      ← All customers
    </Button>
  );

  if (!isHydrated) {
    return (
      <AdminPage title="Customer" actions={backLink}>
        <div role="status" aria-label="Loading customer" className="grid gap-5 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-sm bg-surface" />
          <div className="h-64 animate-pulse rounded-sm bg-surface lg:col-span-2" />
        </div>
      </AdminPage>
    );
  }

  if (!customer) {
    return (
      <AdminPage title="Customer not found" actions={backLink}>
        <EmptyState
          icon="?"
          title="We couldn't find this customer"
          description="The account may have been removed when the demo data was reset."
          action={<Button href="/admin/customers">Back to customers</Button>}
        />
      </AdminPage>
    );
  }

  const blocked = customer.status === 'blocked';
  const averageOrder = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;

  const confirmStatusChange = () => {
    const result = setCustomerStatus(customer.id, blocked ? 'active' : 'blocked');
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(blocked ? `${customer.name} can sign in again` : `${customer.name} has been blocked`);
    setConfirmOpen(false);
  };

  return (
    <AdminPage
      title={customer.name}
      description={`Customer since ${formatDate(customer.createdAt)}`}
      actions={
        <>
          {backLink}
          <Button size="sm" variant={blocked ? 'primary' : 'danger'} onClick={() => setConfirmOpen(true)}>
            {blocked ? 'Unblock customer' : 'Block customer'}
          </Button>
        </>
      }
    >
      {blocked && (
        <p className="mb-5 rounded-sm border border-brand/30 bg-brand-light px-4 py-3 text-[14px] text-ink">
          This account is <span className="font-bold">blocked</span>: the customer has been signed out and cannot sign in until unblocked.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5">
          <AdminCard title="Profile" aside={<CustomerStatusPill status={customer.status} />}>
            <div className="flex items-center gap-4">
              <Avatar name={customer.name} size="lg" />
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-ink">{customer.name}</p>
                <a href={`mailto:${customer.email}`} className={`${LINK_CLASS} break-all text-[14px] font-normal text-ink-2`}>
                  {customer.email}
                </a>
              </div>
            </div>
            <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-[14px]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Phone</dt>
                <dd className="text-ink">{customer.phone ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Registered</dt>
                <dd className="text-ink">{formatDateTime(customer.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Customer ID</dt>
                <dd className="break-all text-right font-mono text-[12px] text-ink">{customer.id}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title={`Addresses (${customer.addresses.length})`}>
            {customer.addresses.length === 0 ? (
              <p className="text-[14px] text-ink-3">No saved addresses.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="py-3 first:pt-0 last:pb-0">
                    <address className="text-[14px] not-italic leading-relaxed text-ink-2">
                      <span className="font-bold text-ink">{address.fullName}</span>
                      {address.isDefault && (
                        <span className="ml-2 align-middle">
                          <StatusPill tone="neutral">Default</StatusPill>
                        </span>
                      )}
                      <br />
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}
                      <br />
                      {address.city}, {address.state} {address.postalCode}, {address.country}
                      <br />
                      <span className="text-ink-3">Phone:</span> {address.phone}
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatTile label="Orders" value={customer.orderCount} />
            <StatTile label="Total spent" value={formatPrice(customer.totalSpent)} hint="Excl. cancelled / refunded" />
            <StatTile label="Avg. order" value={formatPrice(averageOrder)} />
            <StatTile label="Last order" value={<span className="text-[16px]">{formatDate(customer.lastOrderAt)}</span>} />
          </div>

          <AdminCard title="Order history" padded={false}>
            <div className={ADMIN_TABLE.wrap}>
              <table className={ADMIN_TABLE.table}>
                <caption className="sr-only">Orders placed by {customer.name}</caption>
                <thead>
                  <tr>
                    <th scope="col" className={ADMIN_TABLE.th}>
                      Order #
                    </th>
                    <th scope="col" className={ADMIN_TABLE.th}>
                      Date
                    </th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Items
                    </th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Total
                    </th>
                    <th scope="col" className={ADMIN_TABLE.th}>
                      Payment
                    </th>
                    <th scope="col" className={ADMIN_TABLE.th}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.length === 0 ? (
                    <TableEmpty colSpan={6}>This customer hasn&apos;t placed an order yet.</TableEmpty>
                  ) : (
                    customer.orders.map((order) => (
                      <tr key={order.id} className={ADMIN_TABLE.row}>
                        <th scope="row" className={`${ADMIN_TABLE.td} whitespace-nowrap font-normal`}>
                          <Link href={`/admin/orders/${encodeURIComponent(order.orderNumber)}`} className={LINK_CLASS}>
                            {order.orderNumber}
                          </Link>
                        </th>
                        <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>{formatDate(order.createdAt)}</td>
                        <td className={`${ADMIN_TABLE.td} text-right tabular-nums`}>{order.totals.itemCount}</td>
                        <td className={`${ADMIN_TABLE.td} text-right font-bold text-ink tabular-nums`}>{formatPrice(order.totals.total)}</td>
                        <td className={ADMIN_TABLE.td}>
                          <PaymentStatusPill status={order.paymentStatus} />
                        </td>
                        <td className={ADMIN_TABLE.td}>
                          <OrderStatusPill status={order.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
        title={blocked ? `Unblock ${customer.name}?` : `Block ${customer.name}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant={blocked ? 'primary' : 'danger'} onClick={confirmStatusChange}>
              {blocked ? 'Unblock' : 'Block customer'}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink-2">
          {blocked
            ? 'The customer will be able to sign in and place orders again.'
            : 'Blocking signs the customer out immediately and prevents them from logging in until you unblock the account. Their existing orders and data are kept.'}
        </p>
      </Modal>
    </AdminPage>
  );
}

export default CustomerDetailView;
