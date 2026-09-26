'use client';

import Link from 'next/link';
import { useState } from 'react';
import FadeImage from '@/components/FadeImage';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/context/ToastContext';
import { useOrderPayment } from '@/hooks/useAllOrders';
import { useOrder, useOrders } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/format';
import { formatAddressLines } from '@/lib/services/addresses';
import { canCancelOrder, ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, orderStatusStep, PAYMENT_METHOD_LABELS } from '@/lib/services/orders';
import { describePaymentInstrument } from '@/lib/services/payments';
import type { Order, OrderStatus, OrderStatusEvent } from '@/lib/services/types';
import { formatDateTime, InlineFormError, LoadingPanel, OrderStatusBadge, PaymentStatusBadge } from './accountUtils';
import { BoxIcon } from './OrdersList';

type StepState = 'done' | 'current' | 'upcoming' | 'cancelled' | 'refunded';

interface TimelineStep {
  key: string;
  label: string;
  state: StepState;
  at: string | null;
  note: string | null;
}

const lastEvent = (history: readonly OrderStatusEvent[], status: OrderStatus) =>
  [...history].reverse().find((event) => event.status === status);

/**
 * Open / delivered orders: the full ORDER_STATUS_FLOW with timestamps from statusHistory (steps the
 * admin skipped are still marked complete, just without a time). Cancelled / refunded orders: what
 * actually happened, ending in the terminal state.
 */
function buildTimeline(order: Order): TimelineStep[] {
  const history = order.statusHistory ?? [];
  const currentStep = orderStatusStep(order.status);

  if (currentStep >= 0) {
    const delivered = order.status === 'DELIVERED';
    return ORDER_STATUS_FLOW.map((status, index) => {
      const event = lastEvent(history, status);
      const state: StepState = index < currentStep || (delivered && index === currentStep) ? 'done' : index === currentStep ? 'current' : 'upcoming';
      return {
        key: status,
        label: ORDER_STATUS_LABELS[status],
        state,
        at: index <= currentStep ? (event?.at ?? (index === 0 ? order.createdAt : null)) : null,
        note: index <= currentStep ? (event?.note ?? null) : null,
      };
    });
  }

  const events = history.length > 0 ? history : [{ status: order.status, at: order.updatedAt }];
  return events.map((event, index) => ({
    key: `${event.status}-${index}`,
    label: ORDER_STATUS_LABELS[event.status] ?? event.status,
    state: event.status === 'CANCELLED' ? 'cancelled' : event.status === 'REFUNDED' ? 'refunded' : 'done',
    at: event.at,
    note: event.note ?? (event.status === 'CANCELLED' ? order.cancelReason : null),
  }));
}

const DOT_CLASS: Record<StepState, string> = {
  done: 'border-success bg-success text-white',
  current: 'border-brand bg-white text-brand ring-4 ring-brand/15',
  upcoming: 'border-line-strong bg-white text-transparent',
  cancelled: 'border-brand-dark bg-brand-dark text-white',
  refunded: 'border-ink-3 bg-ink-3 text-white',
};

const LABEL_CLASS: Record<StepState, string> = {
  done: 'font-bold text-success',
  current: 'font-bold text-ink',
  upcoming: 'text-ink-3',
  cancelled: 'font-bold text-brand-dark',
  refunded: 'font-bold text-ink-2',
};

function StepGlyph({ state }: { state: StepState }) {
  if (state === 'current') return <span className="h-2 w-2 rounded-full bg-brand" />;
  if (state === 'cancelled') {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === 'refunded') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrderTimeline({ order }: { order: Order }) {
  const steps = buildTimeline(order);
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const lineDone = step.state === 'done' && !isLast && steps[index + 1].state !== 'upcoming';
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0" aria-current={step.state === 'current' ? 'step' : undefined}>
            {!isLast && (
              <span aria-hidden="true" className={`absolute left-[9px] top-5 h-[calc(100%-1.25rem)] w-0.5 ${lineDone ? 'bg-success' : 'bg-line'}`} />
            )}
            <span aria-hidden="true" className={`relative z-[1] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${DOT_CLASS[step.state]}`}>
              <StepGlyph state={step.state} />
            </span>
            <div className="min-w-0 flex-1 -mt-0.5">
              <p className={`text-[14px] ${LABEL_CLASS[step.state]}`}>
                {step.label}
                {step.state === 'current' && <span className="sr-only"> (current status)</span>}
                {step.state === 'done' && <span className="sr-only"> (completed)</span>}
              </p>
              {step.at ? (
                <p className="text-[12px] text-ink-3">{formatDateTime(step.at)}</p>
              ) : step.state === 'upcoming' ? (
                <p className="text-[12px] text-ink-4">Pending</p>
              ) : null}
              {step.note && <p className="mt-0.5 text-[12px] text-ink-2">{step.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function terminalMessage(order: Order): string | null {
  if (order.status === 'REFUNDED') return 'This order was refunded to your original payment method.';
  if (order.status !== 'CANCELLED') return null;
  if (order.paymentStatus === 'PAID') return 'This order was cancelled. Your payment will be refunded to the original method.';
  return 'This order was cancelled. You have not been charged.';
}

const CANCEL_REASON_MAX = 200;

export function OrderDetail({ orderNumber }: { orderNumber: string }) {
  const { order, isReady } = useOrder(orderNumber);
  const { cancelOrder } = useOrders();
  const payment = useOrderPayment(order?.orderNumber ?? null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!isReady) return <LoadingPanel label="Loading your order" />;

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description={`We couldn't find order ${orderNumber.toUpperCase()} in your account.`}
        icon={<BoxIcon />}
        action={
          <>
            <Button href="/account/orders" variant="secondary">
              Back to orders
            </Button>
            <Button href="/products">Continue shopping</Button>
          </>
        }
      />
    );
  }

  const { totals } = order;
  const addressLines = formatAddressLines(order.address);
  const cancellable = canCancelOrder(order);
  const terminalNote = terminalMessage(order);
  const hasTracking = !!order.trackingNumber;

  const closeCancel = () => {
    setCancelOpen(false);
    setCancelError(null);
  };

  const confirmCancel = () => {
    const result = cancelOrder(order.orderNumber, cancelReason.trim() || undefined);
    if (!result.ok) {
      setCancelError(result.error);
      return;
    }
    setCancelOpen(false);
    setCancelReason('');
    setCancelError(null);
    toast.success(`Order ${order.orderNumber} cancelled`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wide text-ink-3 transition-colors hover:text-brand"
        >
          <span aria-hidden="true">←</span> All orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div>
            <h2 className="text-[20px] font-bold text-ink">Order {order.orderNumber}</h2>
            <p className="mt-1 text-[13px] text-ink-3">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section aria-labelledby="order-status-heading" className="rounded-sm border border-line bg-white p-5">
          <h3 id="order-status-heading" className="mb-4 text-[12px] font-bold uppercase tracking-wide text-ink-3">
            Order status
          </h3>
          {terminalNote && (
            <p className="mb-4 rounded-sm bg-surface px-3.5 py-3 text-[13px] text-ink-2">
              {terminalNote}
              {order.cancelReason && (
                <>
                  {' '}
                  <span className="text-ink-3">Reason: {order.cancelReason}</span>
                </>
              )}
            </p>
          )}
          <OrderTimeline order={order} />
        </section>

        <div className="flex flex-col gap-6">
          {hasTracking && (
            <section aria-labelledby="order-tracking-heading" className="rounded-sm border border-line bg-white p-5">
              <h3 id="order-tracking-heading" className="text-[12px] font-bold uppercase tracking-wide text-ink-3">
                Shipment tracking
              </h3>
              <dl className="mt-3 flex flex-col gap-2 text-[14px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-3">Carrier</dt>
                  <dd className="font-bold text-ink">{order.trackingCarrier ?? '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-3">Tracking no.</dt>
                  <dd className="break-all text-right font-bold tabular-nums text-ink">{order.trackingNumber}</dd>
                </div>
              </dl>
            </section>
          )}

          {cancellable && (
            <section aria-labelledby="order-cancel-heading" className="rounded-sm border border-line bg-white p-5">
              <h3 id="order-cancel-heading" className="text-[12px] font-bold uppercase tracking-wide text-ink-3">
                Need to make a change?
              </h3>
              <p className="mt-2 text-[13px] text-ink-2">You can cancel this order any time before it ships.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => setCancelOpen(true)}>
                Cancel order
              </Button>
            </section>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section aria-labelledby="order-items-heading" className="rounded-sm border border-line bg-white">
          <h3 id="order-items-heading" className="border-b border-line px-5 py-4 text-[12px] font-bold uppercase tracking-wide text-ink">
            Items ({totals.itemCount})
          </h3>
          <ul className="divide-y divide-line">
            {order.items.map((item, i) => (
              <li key={`${item.productId}-${item.variantId ?? 'base'}-${i}`} className="flex gap-4 px-5 py-4">
                <Link
                  href={`/products/${item.slug}`}
                  className="relative aspect-[3/4] w-[72px] shrink-0 overflow-hidden rounded-sm border border-line bg-surface"
                >
                  {item.image ? (
                    <FadeImage src={item.image} alt={item.name} fill sizes="72px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-ink-4">
                      <BoxIcon size={24} />
                    </span>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-wide text-ink-3">{item.sku}</p>
                    <Link
                      href={`/products/${item.slug}`}
                      className="mt-0.5 line-clamp-2 text-[14px] font-bold text-ink transition-colors hover:text-brand"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel && <p className="mt-0.5 text-[12px] text-ink-3">{item.variantLabel}</p>}
                    <p className="mt-1 text-[12px] text-ink-3">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex shrink-0 items-baseline justify-between gap-3 whitespace-nowrap sm:flex-col sm:items-end sm:gap-0.5">
                    <p className="text-[12px] text-ink-3">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                    <p className="text-[14px] font-bold text-ink">{formatPrice(item.lineTotal)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="order-summary-heading" className="rounded-sm border border-line bg-surface p-5">
            <h3 id="order-summary-heading" className="text-[12px] font-bold uppercase tracking-wide text-ink-3">
              Price details ({totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'})
            </h3>
            <dl className="mt-4 flex flex-col gap-2.5 text-[14px]">
              <SummaryRow label="Total MRP" value={formatPrice(totals.subtotal)} />
              {totals.discount > 0 && (
                <SummaryRow
                  label={order.couponCode ? `Coupon discount (${order.couponCode})` : 'Discount'}
                  value={`−${formatPrice(totals.discount)}`}
                  accent
                />
              )}
              <SummaryRow
                label="Shipping fee"
                value={totals.shipping === 0 ? 'FREE' : formatPrice(totals.shipping)}
                accent={totals.shipping === 0}
              />
              <SummaryRow label="Tax" value={formatPrice(totals.tax)} />
              <div className="mt-2 flex items-baseline justify-between border-t border-line-strong pt-3">
                <dt className="text-[14px] font-bold text-ink">Total amount</dt>
                <dd className="text-[16px] font-bold text-ink">{formatPrice(totals.total)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="order-shipping-heading" className="rounded-sm border border-line bg-white p-5">
            <h3 id="order-shipping-heading" className="text-[12px] font-bold uppercase tracking-wide text-ink-3">
              Shipping address
            </h3>
            <address className="mt-3 text-[14px] not-italic leading-relaxed text-ink-2">
              <span className="block font-bold text-ink">{order.address.fullName}</span>
              {addressLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
              <span className="mt-1 block text-ink-3">Mobile: {order.address.phone}</span>
            </address>
          </section>

          <section aria-labelledby="order-payment-heading" className="rounded-sm border border-line bg-white p-5">
            <h3 id="order-payment-heading" className="text-[12px] font-bold uppercase tracking-wide text-ink-3">
              Payment
            </h3>
            <dl className="mt-3 flex flex-col gap-2 text-[14px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-3">Method</dt>
                <dd className="text-right font-bold text-ink">
                  {payment ? describePaymentInstrument(payment) : (PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-3">Status</dt>
                <dd>
                  <PaymentStatusBadge status={order.paymentStatus} method={order.paymentMethod} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-3">Amount</dt>
                <dd className="font-bold text-ink">{formatPrice(payment?.amount ?? totals.total)}</dd>
              </div>
              {payment?.reference && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-3">Reference</dt>
                  <dd className="break-all text-right text-[13px] font-medium tabular-nums text-ink-2">{payment.reference}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={closeCancel}
        title={`Cancel order ${order.orderNumber}?`}
        description={
          order.paymentStatus === 'PAID'
            ? 'The items go back on sale and your payment will be refunded to the original method. This cannot be undone.'
            : 'The items go back on sale and nothing will be charged. This cannot be undone.'
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={closeCancel}>
              Keep order
            </Button>
            <Button variant="danger" onClick={confirmCancel}>
              Cancel order
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Textarea
            label="Reason (optional)"
            placeholder="e.g. Ordered by mistake, found a better price…"
            rows={3}
            maxLength={CANCEL_REASON_MAX}
            showCount
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <InlineFormError message={cancelError} />
        </div>
      </Modal>
    </div>
  );
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-2">{label}</dt>
      <dd className={`font-medium ${accent ? 'text-success' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}

export default OrderDetail;
