'use client';

import Link from 'next/link';
import FadeImage from '@/components/FadeImage';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useOrder } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/format';
import { formatAddressLines } from '@/lib/services/addresses';
import { PAYMENT_METHOD_LABELS } from '@/lib/services/orders';
import type { OrderStatus } from '@/lib/services/types';
import { formatDateTime, LoadingPanel, OrderStatusBadge, PaymentStatusBadge } from './accountUtils';
import { BoxIcon } from './OrdersList';

const TIMELINE_STEPS: readonly { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Order placed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
];

// How far along the 3-step timeline each status is (CONFIRMED still sits on step 1).
const STATUS_PROGRESS: Record<OrderStatus, number> = {
  PLACED: 0,
  CONFIRMED: 0,
  SHIPPED: 1,
  DELIVERED: 2,
  CANCELLED: -1,
};

export function OrderDetail({ orderNumber }: { orderNumber: string }) {
  const { order, isReady } = useOrder(orderNumber);

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
  const progress = STATUS_PROGRESS[order.status] ?? 0;
  const cancelled = order.status === 'CANCELLED';

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

      <section aria-label="Order status" className="rounded-sm border border-line bg-white p-5">
        {cancelled ? (
          <p className="text-[14px] text-ink-2">
            This order was <span className="font-bold text-brand">cancelled</span>. Any payment made will be refunded to the original
            method.
          </p>
        ) : (
          <ol className="flex items-start">
            {TIMELINE_STEPS.map((step, index) => {
              const reached = index <= progress;
              const current = index === progress;
              const isLast = index === TIMELINE_STEPS.length - 1;
              return (
                <li key={step.key} className={`relative flex flex-col items-center ${isLast ? 'flex-none' : 'flex-1'}`}>
                  <div className="flex w-full items-center">
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        reached ? 'border-success bg-success text-white' : 'border-line-strong bg-white'
                      }`}
                    >
                      {reached && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className={`h-0.5 flex-1 ${index < progress ? 'bg-success' : 'bg-line'}`}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-2 self-start whitespace-nowrap text-[12px] ${
                      current ? 'font-bold text-ink' : reached ? 'font-bold text-success' : 'text-ink-3'
                    }`}
                  >
                    {step.label}
                    {current && <span className="sr-only"> (current)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

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
                <dd className="font-bold text-ink">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-3">Status</dt>
                <dd>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
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
