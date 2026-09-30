'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ADMIN_TABLE, AdminCard, AdminPage, StatusPill, type PillTone } from '@/components/admin/AdminPage';
import { FilterSelect, formatDateTime, LINK_CLASS, Pagination, SearchBox, StatTile, TableEmpty, TableSkeleton } from '@/components/admin/orders/shared';
import { Button, Modal } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useAllOrders } from '@/hooks/useAllOrders';
import { useOutbox } from '@/hooks/useNotifications';
import { drainOutbox, getEmailTransport, NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPES } from '@/lib/services/notifications';
import type { NotificationRecord, NotificationType } from '@/lib/services/types';

const PAGE_SIZE = 10;

type TypeFilter = 'ALL' | NotificationType;
type DeliveryFilter = 'ALL' | 'delivered' | 'queued';

const TYPE_OPTIONS: readonly { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'All types' },
  ...NOTIFICATION_TYPES.map((type) => ({ value: type, label: NOTIFICATION_TYPE_LABELS[type] })),
];
const DELIVERY_OPTIONS: readonly { value: DeliveryFilter; label: string }[] = [
  { value: 'ALL', label: 'Delivered + queued' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'queued', label: 'Queued' },
];

const TYPE_TONES: Record<NotificationType, PillTone> = {
  REGISTRATION: 'brand',
  ORDER_CONFIRMATION: 'info',
  PAYMENT_RECEIVED: 'success',
  PAYMENT_FAILED: 'danger',
  ORDER_STATUS: 'neutral',
  ORDER_SHIPPED: 'warning',
  ORDER_DELIVERED: 'success',
  ORDER_CANCELLED: 'danger',
  ORDER_REFUNDED: 'neutral',
};

export function OutboxView() {
  const { emails, isHydrated } = useOutbox();
  const { orders } = useAllOrders();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('ALL');
  const [delivery, setDelivery] = useState<DeliveryFilter>('ALL');
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<NotificationRecord | null>(null);
  const [retrying, setRetrying] = useState(false);

  const orderNumbers = useMemo(() => new Set(orders.map((order) => order.orderNumber)), [orders]);

  const queuedCount = useMemo(() => emails.filter((e) => e.deliveredAt === null).length, [emails]);
  const recipientCount = useMemo(() => new Set(emails.map((e) => e.emailTo)).size, [emails]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return emails.filter((email) => {
      if (type !== 'ALL' && email.type !== type) return false;
      if (delivery === 'delivered' && email.deliveredAt === null) return false;
      if (delivery === 'queued' && email.deliveredAt !== null) return false;
      if (!needle) return true;
      return (
        email.emailTo.toLowerCase().includes(needle) ||
        email.subject.toLowerCase().includes(needle) ||
        (email.orderNumber?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [emails, search, type, delivery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };
  const hasFilters = search.trim() !== '' || type !== 'ALL' || delivery !== 'ALL';

  const retry = async () => {
    setRetrying(true);
    try {
      const delivered = await drainOutbox();
      toast.success(delivered > 0 ? `${delivered} email${delivered === 1 ? '' : 's'} delivered` : 'Nothing was waiting in the outbox');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <AdminPage
      title="Notifications"
      description="Every transactional email the store has rendered — welcome, order, payment, shipping and delivery messages."
      actions={
        queuedCount > 0 ? (
          <Button variant="secondary" size="sm" onClick={retry} loading={retrying} loadingText="Sending">
            Retry {queuedCount} queued
          </Button>
        ) : undefined
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Emails rendered" value={isHydrated ? emails.length : '—'} hint="All time" />
        <StatTile label="Recipients" value={isHydrated ? recipientCount : '—'} hint="Distinct addresses" />
        <StatTile label="Queued" value={isHydrated ? queuedCount : '—'} hint="Waiting for a transport" />
        <StatTile label="Transport" value={<span className="font-mono text-[15px]">{isHydrated ? getEmailTransport().id : '—'}</span>} hint="Active email provider" />
      </div>

      <div className="mb-5 rounded-sm border border-line bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-2">
        <p className="font-bold text-ink">How the outbox works</p>
        <p className="mt-1">
          No email provider is connected yet. Every event still writes the rendered message (recipient, subject, plain-text body) to this
          outbox alongside the customer&rsquo;s in-app notification, so nothing is lost. The active transport is{' '}
          <code className="rounded-sm bg-white px-1 py-0.5 font-mono text-[12px] text-ink">{isHydrated ? getEmailTransport().id : 'console'}</code>
          , which logs to the browser console and marks the message delivered. To send real email, implement <code className="font-mono text-[12px]">EmailTransport</code>{' '}
          in <code className="font-mono text-[12px]">src/lib/services/notifications.ts</code> with SendGrid, Resend or SES behind a server route
          and call <code className="font-mono text-[12px]">setEmailTransport()</code> — the outbox then drains through it unchanged.
        </p>
      </div>

      <AdminCard padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3">
          <SearchBox
            id="outbox-search"
            label="Search emails"
            placeholder="Search recipient, subject or order #"
            value={search}
            onChange={withReset(setSearch)}
            className="w-full sm:w-auto sm:flex-1 sm:basis-64"
          />
          <FilterSelect id="outbox-type" label="Type" value={type} onChange={withReset(setType)} options={TYPE_OPTIONS} />
          <FilterSelect id="outbox-delivery" label="Delivery" value={delivery} onChange={withReset(setDelivery)} options={DELIVERY_OPTIONS} />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setType('ALL');
                setDelivery('ALL');
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
              <table className={`${ADMIN_TABLE.table} min-w-[960px]`}>
                <caption className="sr-only">Email outbox</caption>
                <thead>
                  <tr>
                    {['Date', 'To', 'Subject', 'Type', 'Order', 'Delivery', ''].map((heading, index) => (
                      <th key={index} scope="col" className={ADMIN_TABLE.th}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <TableEmpty colSpan={7}>
                      {emails.length === 0
                        ? 'No emails yet. Register an account or place an order and the messages will appear here.'
                        : 'No emails match these filters.'}
                    </TableEmpty>
                  ) : (
                    visible.map((email) => {
                      const hasOrder = !!email.orderNumber && orderNumbers.has(email.orderNumber);
                      return (
                        <tr key={email.id} className={ADMIN_TABLE.row}>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>{formatDateTime(email.createdAt)}</td>
                          <td className={`${ADMIN_TABLE.td} max-w-[220px] truncate`} title={email.emailTo}>
                            {email.emailTo}
                          </td>
                          <th scope="row" className={`${ADMIN_TABLE.td} max-w-[360px] font-normal`}>
                            <button
                              type="button"
                              onClick={() => setPreview(email)}
                              className="line-clamp-2 text-left font-bold text-ink transition-colors hover:text-brand focus-visible:outline-none focus-visible:underline"
                            >
                              {email.subject}
                            </button>
                          </th>
                          <td className={ADMIN_TABLE.td}>
                            <StatusPill tone={TYPE_TONES[email.type]}>{NOTIFICATION_TYPE_LABELS[email.type]}</StatusPill>
                          </td>
                          <td className={`${ADMIN_TABLE.td} whitespace-nowrap`}>
                            {email.orderNumber ? (
                              hasOrder ? (
                                <Link href={`/admin/orders/${encodeURIComponent(email.orderNumber)}`} className={LINK_CLASS}>
                                  {email.orderNumber}
                                </Link>
                              ) : (
                                <span className="text-ink-3" title="Payment attempt without an order">
                                  {email.orderNumber}
                                </span>
                              )
                            ) : (
                              <span className="text-ink-4">—</span>
                            )}
                          </td>
                          <td className={ADMIN_TABLE.td}>
                            {email.deliveredAt ? (
                              <StatusPill tone="success">Delivered</StatusPill>
                            ) : (
                              <StatusPill tone="warning">Queued</StatusPill>
                            )}
                            {email.deliveredAt && <div className="mt-1 whitespace-nowrap text-[12px] text-ink-3">{formatDateTime(email.deliveredAt)}</div>}
                          </td>
                          <td className={`${ADMIN_TABLE.td} text-right`}>
                            <Button variant="ghost" size="sm" onClick={() => setPreview(email)} aria-label={`Preview email: ${email.subject}`}>
                              Preview
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} noun="emails" />
          </>
        )}
      </AdminCard>

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.subject ?? 'Email preview'}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setPreview(null)}>
            Close
          </Button>
        }
      >
        {preview && (
          <div className="flex flex-col gap-4">
            <dl className="grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-[auto_1fr]">
              <dt className="text-ink-3">To</dt>
              <dd className="font-bold text-ink">{preview.emailTo}</dd>
              <dt className="text-ink-3">Type</dt>
              <dd>
                <StatusPill tone={TYPE_TONES[preview.type]}>{NOTIFICATION_TYPE_LABELS[preview.type]}</StatusPill>
              </dd>
              <dt className="text-ink-3">Created</dt>
              <dd className="text-ink-2">{formatDateTime(preview.createdAt)}</dd>
              <dt className="text-ink-3">Delivery</dt>
              <dd className="text-ink-2">{preview.deliveredAt ? `Delivered ${formatDateTime(preview.deliveredAt)} via ${getEmailTransport().id}` : 'Queued — waiting for a transport'}</dd>
              {preview.orderNumber && (
                <>
                  <dt className="text-ink-3">Order</dt>
                  <dd className="text-ink-2">{preview.orderNumber}</dd>
                </>
              )}
            </dl>
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-sm border border-line bg-surface p-4 font-sans text-[13px] leading-relaxed text-ink-2">
              {preview.body}
            </pre>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
}

export default OutboxView;
