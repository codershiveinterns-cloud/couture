'use client';

import Link from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';
import { AdminCard, AdminPage, ADMIN_TABLE } from '@/components/admin/AdminPage';
import FadeImage from '@/components/FadeImage';
import { Button, EmptyState, Input, Modal, Select, Textarea } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import { useAdminOrder, useOrderPayment } from '@/hooks/useAllOrders';
import { formatPrice } from '@/lib/format';
import {
  cancelOrder,
  canCancelOrder,
  canRefundOrder,
  canSetTracking,
  markCodCollected,
  nextStatuses,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  orderStatusStep,
  PAYMENT_METHOD_LABELS,
  refundOrder,
  setTracking,
  SHIPPING_CARRIERS,
  updateOrderStatus,
} from '@/lib/services/orders';
import type { AdminOrder, OrderStatus, OrderStatusEvent, PaymentRecord } from '@/lib/services/types';
import { formatDateTime, LINK_CLASS, OrderStatusPill, PaymentStatusPill } from './shared';

const OTHER_CARRIER = '__other__';

const CARRIER_LABELS: Record<string, string> = { BlueDart: 'Blue Dart' };
const CARRIER_OPTIONS = [
  ...SHIPPING_CARRIERS.map((carrier) => ({ value: carrier, label: CARRIER_LABELS[carrier] ?? carrier })),
  { value: OTHER_CARRIER, label: 'Other' },
];

/* -------------------------------------------------------------------------- */
/* Timeline                                                                    */
/* -------------------------------------------------------------------------- */

interface TimelineStep {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming' | 'skipped' | 'terminal';
  at: string | null;
  note: string | null;
}

function buildTimeline(order: AdminOrder): TimelineStep[] {
  const lastEvent = new Map<OrderStatus, OrderStatusEvent>();
  for (const event of order.statusHistory) lastEvent.set(event.status, event);

  // Furthest flow step the order ever reached (a cancelled order keeps its progress).
  const reached = order.statusHistory.reduce((max, event) => Math.max(max, orderStatusStep(event.status)), -1);
  const closed = orderStatusStep(order.status) === -1;

  const steps: TimelineStep[] = ORDER_STATUS_FLOW.map((status, index) => {
    const event = lastEvent.get(status);
    let state: TimelineStep['state'];
    if (index > reached) state = 'upcoming';
    else if (!event) state = 'skipped';
    else if (!closed && index === reached) state = 'current';
    else state = 'done';
    return { key: status, label: ORDER_STATUS_LABELS[status], state, at: event?.at ?? null, note: event?.note ?? null };
  });

  order.statusHistory.forEach((event, index) => {
    if (orderStatusStep(event.status) !== -1) return;
    steps.push({
      key: `${event.status}-${index}`,
      label: ORDER_STATUS_LABELS[event.status],
      state: 'terminal',
      at: event.at,
      note: event.note ?? null,
    });
  });
  // Hide the steps a closed order never got to.
  return closed ? steps.filter((step) => step.state !== 'upcoming') : steps;
}

const DOT_CLASS: Record<TimelineStep['state'], string> = {
  done: 'border-success bg-success',
  current: 'border-brand bg-brand ring-4 ring-brand/15',
  upcoming: 'border-line-strong bg-white',
  skipped: 'border-line-strong bg-surface',
  terminal: 'border-ink bg-ink',
};

function StatusTimeline({ order }: { order: AdminOrder }) {
  const steps = buildTimeline(order);
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-[6px] top-4 h-full w-px ${step.state === 'upcoming' ? 'bg-line' : 'bg-line-strong'}`}
              />
            )}
            <span aria-hidden="true" className={`relative mt-1 h-[13px] w-[13px] shrink-0 rounded-full border-2 ${DOT_CLASS[step.state]}`} />
            <div className="min-w-0">
              <p className={`text-[14px] font-bold ${step.state === 'upcoming' || step.state === 'skipped' ? 'text-ink-4' : 'text-ink'}`}>
                {step.label}
                {step.state === 'current' && <span className="ml-2 text-[11px] font-bold uppercase tracking-wide text-brand">Current</span>}
              </p>
              <p className="text-[12px] text-ink-3">
                {step.state === 'upcoming' ? 'Pending' : step.state === 'skipped' ? 'Skipped' : formatDateTime(step.at)}
              </p>
              {step.note && <p className="mt-1 rounded-sm bg-surface px-2.5 py-1.5 text-[13px] text-ink-2">{step.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* Panels                                                                      */
/* -------------------------------------------------------------------------- */

function UpdateStatusPanel({
  order,
  onRequestCancel,
  onRequestRefund,
}: {
  order: AdminOrder;
  onRequestCancel(note: string): void;
  onRequestRefund(note: string): void;
}) {
  const options = nextStatuses(order);
  const [selected, setSelected] = useState<string>('');
  const [note, setNote] = useState('');
  const status = options.find((option) => option === selected) ?? null;

  if (options.length === 0) {
    return <p className="text-[14px] text-ink-3">This order is closed — no further status changes are possible.</p>;
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!status) {
      toast.error('Choose the new status first');
      return;
    }
    // Destructive transitions go through their confirmation dialogs.
    if (status === 'CANCELLED') return onRequestCancel(note);
    if (status === 'REFUNDED') return onRequestRefund(note);
    const result = updateOrderStatus(order.orderNumber, status, note.trim() || undefined);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Order marked as ${ORDER_STATUS_LABELS[status]}`);
    setSelected('');
    setNote('');
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Select
        label="New status"
        placeholder="Select status"
        value={status ?? ''}
        onChange={(event) => setSelected(event.target.value)}
        options={options.map((option) => ({ value: option, label: ORDER_STATUS_LABELS[option] }))}
      />
      <Textarea
        label="Note (optional)"
        rows={2}
        maxLength={200}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Shown on the order timeline"
      />
      <Button type="submit" size="sm" disabled={!status} className="self-start">
        Update status
      </Button>
    </form>
  );
}

function TrackingPanel({ order }: { order: AdminOrder }) {
  const known = order.trackingCarrier !== null && SHIPPING_CARRIERS.includes(order.trackingCarrier);
  const [carrier, setCarrier] = useState(order.trackingCarrier === null ? '' : known ? order.trackingCarrier : OTHER_CARRIER);
  const [customCarrier, setCustomCarrier] = useState(known ? '' : (order.trackingCarrier ?? ''));
  const [number, setNumber] = useState(order.trackingNumber ?? '');
  const [errors, setErrors] = useState<{ carrier?: string; trackingNumber?: string }>({});

  if (!canSetTracking(order)) {
    return order.trackingNumber ? (
      <dl className="text-[14px]">
        <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-3">{order.trackingCarrier ?? 'Carrier'}</dt>
        <dd className="mt-0.5 font-bold text-ink">{order.trackingNumber}</dd>
      </dl>
    ) : (
      <p className="text-[14px] text-ink-3">No tracking was recorded for this order.</p>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const carrierValue = carrier === OTHER_CARRIER ? customCarrier : carrier;
    const result = setTracking(order.orderNumber, carrierValue, number);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      return;
    }
    setErrors({});
    setNumber(result.data.trackingNumber ?? '');
    toast.success('Tracking details saved');
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Select
        label="Carrier"
        placeholder="Select carrier"
        value={carrier}
        onChange={(event) => setCarrier(event.target.value)}
        options={CARRIER_OPTIONS}
        error={carrier === OTHER_CARRIER ? null : errors.carrier}
      />
      {carrier === OTHER_CARRIER && (
        <Input
          label="Carrier name"
          value={customCarrier}
          maxLength={40}
          onChange={(event) => setCustomCarrier(event.target.value)}
          error={errors.carrier}
        />
      )}
      <Input
        label="Tracking number"
        value={number}
        maxLength={40}
        autoComplete="off"
        onChange={(event) => setNumber(event.target.value.toUpperCase())}
        hint="6–40 letters, numbers or dashes"
        error={errors.trackingNumber}
      />
      <Button type="submit" size="sm" variant="secondary" className="self-start">
        {order.trackingNumber ? 'Update tracking' : 'Save tracking'}
      </Button>
      {order.status !== 'SHIPPED' && order.status !== 'OUT_FOR_DELIVERY' && (
        <p className="text-[12px] text-ink-3">Saving tracking does not change the status — mark the order as Shipped separately.</p>
      )}
    </form>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-[14px]">
      <dt className="shrink-0 text-ink-3">{label}</dt>
      <dd className="min-w-0 break-words text-right text-ink">{children}</dd>
    </div>
  );
}

function PaymentCard({ order, payment }: { order: AdminOrder; payment: PaymentRecord | null }) {
  const instrument =
    payment?.cardLast4 !== undefined
      ? `${payment.cardBrand ?? 'Card'} •••• ${payment.cardLast4}`
      : payment?.upiId !== undefined
        ? payment.upiId
        : null;
  return (
    <AdminCard title="Payment" aside={<PaymentStatusPill status={order.paymentStatus} />}>
      <dl>
        <DetailRow label="Method">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</DetailRow>
        <DetailRow label="Amount">{formatPrice(payment?.amount ?? order.totals.total)}</DetailRow>
        {instrument && <DetailRow label={payment?.cardLast4 !== undefined ? 'Card' : 'UPI ID'}>{instrument}</DetailRow>}
        {payment ? (
          <>
            <DetailRow label="Gateway">{payment.gateway}</DetailRow>
            <DetailRow label="Reference">
              <span className="font-mono text-[13px]">{payment.reference}</span>
            </DetailRow>
            <DetailRow label="Updated">{formatDateTime(payment.updatedAt)}</DetailRow>
            {payment.failureReason && (
              <DetailRow label="Failure reason">
                <span className="text-brand">{payment.failureReason}</span>
              </DetailRow>
            )}
          </>
        ) : (
          <p className="mt-2 text-[12px] text-ink-3">
            No gateway record exists for this order yet (placed before payments were tracked). One is created on the first payment action.
          </p>
        )}
      </dl>
    </AdminCard>
  );
}

/* -------------------------------------------------------------------------- */
/* View                                                                        */
/* -------------------------------------------------------------------------- */

type Dialog = { kind: 'cancel' | 'refund'; note: string } | null;

function OrderDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading order" className="grid gap-5 lg:grid-cols-3">
      <div className="h-72 animate-pulse rounded-sm bg-surface lg:col-span-2" />
      <div className="h-72 animate-pulse rounded-sm bg-surface" />
    </div>
  );
}

export function OrderDetailView({ orderNumber }: { orderNumber: string }) {
  const { order, isHydrated } = useAdminOrder(orderNumber);
  const payment = useOrderPayment(orderNumber);
  const [dialog, setDialog] = useState<Dialog>(null);

  const backLink = (
    <Button href="/admin/orders" variant="secondary" size="sm">
      ← All orders
    </Button>
  );

  if (!isHydrated) {
    return (
      <AdminPage title="Order" actions={backLink}>
        <OrderDetailSkeleton />
      </AdminPage>
    );
  }

  if (!order) {
    return (
      <AdminPage title="Order not found" actions={backLink}>
        <EmptyState
          icon="?"
          title={`No order "${orderNumber.toUpperCase()}"`}
          description="This order number doesn't exist. It may belong to a failed payment attempt (no order is created for those) or the demo data was reset."
          action={
            <>
              <Button href="/admin/orders">Back to orders</Button>
              <Button href="/admin/payments" variant="secondary">
                View payments
              </Button>
            </>
          }
        />
      </AdminPage>
    );
  }

  const canCollectCod = order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING';
  const canCancel = canCancelOrder(order);
  const canRefund = canRefundOrder(order);

  const collectCod = () => {
    const result = markCodCollected(order.orderNumber);
    if (result.ok) toast.success('Cash on delivery marked as collected');
    else toast.error(result.error);
  };

  const confirmDialog = () => {
    if (!dialog) return;
    const note = dialog.note.trim() || undefined;
    const result = dialog.kind === 'cancel' ? cancelOrder(order.orderNumber, note) : refundOrder(order.orderNumber, note);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(dialog.kind === 'cancel' ? 'Order cancelled and stock restored' : 'Refund processed');
    setDialog(null);
  };

  const { totals } = order;

  return (
    <AdminPage
      title={`Order ${order.orderNumber}`}
      description={`Placed ${formatDateTime(order.createdAt)} · last updated ${formatDateTime(order.updatedAt)}`}
      actions={backLink}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <OrderStatusPill status={order.status} />
        <PaymentStatusPill status={order.paymentStatus} />
        <span className="text-[13px] text-ink-3">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
        <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
          {canCollectCod && (
            <Button size="sm" variant="secondary" onClick={collectCod}>
              Mark COD collected
            </Button>
          )}
          {canRefund && (
            <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: 'refund', note: '' })}>
              Process refund
            </Button>
          )}
          {canCancel && (
            <Button size="sm" variant="danger" onClick={() => setDialog({ kind: 'cancel', note: '' })}>
              Cancel order
            </Button>
          )}
        </div>
      </div>

      {order.cancelReason && (
        <p className="mb-5 rounded-sm border border-brand/30 bg-brand-light px-4 py-3 text-[14px] text-ink">
          <span className="font-bold">Cancellation reason:</span> {order.cancelReason}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          <AdminCard title={`Items (${totals.itemCount})`} padded={false}>
            <div className={ADMIN_TABLE.wrap}>
              <table className={ADMIN_TABLE.table}>
                <caption className="sr-only">Order items</caption>
                <thead>
                  <tr>
                    <th scope="col" className={ADMIN_TABLE.th}>
                      Product
                    </th>
                    <th scope="col" className={ADMIN_TABLE.th}>
                      SKU
                    </th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Qty
                    </th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Unit
                    </th>
                    <th scope="col" className={`${ADMIN_TABLE.th} text-right`}>
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={`${item.productId}:${item.variantId ?? ''}`} className={ADMIN_TABLE.row}>
                      <th scope="row" className={`${ADMIN_TABLE.td} font-normal`}>
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-sm bg-surface">
                            {item.image?.startsWith('https://images.unsplash.com/') && (
                              <FadeImage src={item.image} alt="" fill sizes="44px" className="object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-ink">{item.name}</p>
                            {item.variantLabel && <p className="text-[12px] text-ink-3">{item.variantLabel}</p>}
                          </div>
                        </div>
                      </th>
                      <td className={`${ADMIN_TABLE.td} whitespace-nowrap font-mono text-[12px]`}>{item.sku}</td>
                      <td className={`${ADMIN_TABLE.td} text-right tabular-nums`}>{item.quantity}</td>
                      <td className={`${ADMIN_TABLE.td} text-right tabular-nums`}>{formatPrice(item.unitPrice)}</td>
                      <td className={`${ADMIN_TABLE.td} text-right font-bold text-ink tabular-nums`}>{formatPrice(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto w-full max-w-sm px-5 py-4">
              <DetailRow label="Subtotal">{formatPrice(totals.subtotal)}</DetailRow>
              {(totals.discount > 0 || order.couponCode) && (
                <DetailRow label={order.couponCode ? `Discount (${order.couponCode})` : 'Discount'}>
                  <span className="text-success">−{formatPrice(totals.discount)}</span>
                </DetailRow>
              )}
              <DetailRow label="Shipping">{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</DetailRow>
              <DetailRow label="Tax">{formatPrice(totals.tax)}</DetailRow>
              <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-[16px] font-bold text-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(totals.total)}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Status timeline">
            <StatusTimeline order={order} />
          </AdminCard>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <AdminCard title="Update status">
            <UpdateStatusPanel
              key={order.status}
              order={order}
              onRequestCancel={(note) => setDialog({ kind: 'cancel', note })}
              onRequestRefund={(note) => setDialog({ kind: 'refund', note })}
            />
          </AdminCard>

          <AdminCard title="Tracking">
            <TrackingPanel key={`${order.trackingCarrier}:${order.trackingNumber}:${canSetTracking(order)}`} order={order} />
          </AdminCard>

          <AdminCard title="Customer">
            <p className="text-[14px] font-bold text-ink">{order.customer.name}</p>
            <p className="break-all text-[14px] text-ink-2">{order.customer.email}</p>
            <Link href={`/admin/customers/${encodeURIComponent(order.customer.id)}`} className={`${LINK_CLASS} mt-2 inline-block text-[13px] text-brand`}>
              View customer profile
            </Link>
          </AdminCard>

          <AdminCard title="Shipping address">
            <address className="text-[14px] not-italic leading-relaxed text-ink-2">
              <span className="font-bold text-ink">{order.address.fullName}</span>
              <br />
              {order.address.line1}
              {order.address.line2 && (
                <>
                  <br />
                  {order.address.line2}
                </>
              )}
              <br />
              {order.address.city}, {order.address.state} {order.address.postalCode}
              <br />
              {order.address.country}
              <br />
              <span className="text-ink-3">Phone:</span> {order.address.phone}
            </address>
          </AdminCard>

          <PaymentCard order={order} payment={payment} />
        </div>
      </div>

      <Modal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.kind === 'refund' ? `Refund order ${order.orderNumber}?` : `Cancel order ${order.orderNumber}?`}
        description={
          dialog?.kind === 'refund'
            ? `${formatPrice(totals.total)} will be marked as refunded to the customer and the order moves to Refunded. This cannot be undone.`
            : order.paymentStatus === 'PAID'
              ? 'The items go back into stock. The payment stays Paid until you process a refund. This cannot be undone.'
              : 'The items go back into stock and the pending payment is cancelled. This cannot be undone.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Keep order
            </Button>
            <Button variant="danger" onClick={confirmDialog}>
              {dialog?.kind === 'refund' ? 'Process refund' : 'Cancel order'}
            </Button>
          </>
        }
      >
        <Textarea
          label={dialog?.kind === 'refund' ? 'Refund note (optional)' : 'Reason (optional)'}
          rows={3}
          maxLength={200}
          value={dialog?.note ?? ''}
          onChange={(event) => setDialog((current) => (current ? { ...current, note: event.target.value } : current))}
          placeholder={dialog?.kind === 'refund' ? 'e.g. Item returned by customer' : 'e.g. Customer requested cancellation'}
        />
      </Modal>
    </AdminPage>
  );
}

export default OrderDetailView;
