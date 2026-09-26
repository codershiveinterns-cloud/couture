'use client';

import Link from 'next/link';
import FadeImage from '@/components/FadeImage';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useOrders } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/format';
import { PAYMENT_METHOD_LABELS } from '@/lib/services/orders';
import type { Order } from '@/lib/services/types';
import { formatDate, LoadingPanel, OrderStatusBadge, PaymentStatusBadge } from './accountUtils';

const MAX_THUMBNAILS = 4;

export function OrdersList() {
  const { orders, isReady } = useOrders();

  if (!isReady) return <LoadingPanel label="Loading your orders" />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-bold text-ink">All orders</h2>
        <p className="mt-1 text-[13px] text-ink-3">
          {orders.length === 0
            ? 'Orders you place will show up here.'
            : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}, newest first.`}
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="You haven't placed any orders yet"
          description="When you place an order, you'll be able to track it here."
          icon={<BoxIcon />}
          action={
            <Button href="/products" variant="secondary">
              Start shopping
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderRow order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.totals.itemCount;
  const thumbnails = order.items.slice(0, MAX_THUMBNAILS);
  const extra = order.items.length - thumbnails.length;

  return (
    <Link
      href={`/account/orders/${order.orderNumber}`}
      className="group block rounded-sm border border-line bg-white transition-all hover:border-line-strong hover:shadow-[0_2px_16px_4px_rgba(40,44,63,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink animate-fade-in"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} method={order.paymentMethod} />
          <p className="text-[14px] font-bold text-ink transition-colors group-hover:text-brand">{order.orderNumber}</p>
        </div>
        <p className="text-[12px] text-ink-3">
          {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-2">
          {thumbnails.map((item, i) => (
            <span
              key={`${item.productId}-${item.variantId ?? 'base'}-${i}`}
              className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-sm border border-line bg-surface"
            >
              {item.image ? (
                <FadeImage src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-ink-4">
                  <BoxIcon size={20} />
                </span>
              )}
            </span>
          ))}
          {extra > 0 && (
            <span className="flex aspect-[3/4] w-14 shrink-0 items-center justify-center rounded-sm border border-dashed border-line-strong text-[12px] font-bold text-ink-3">
              +{extra}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-[12px] font-bold uppercase tracking-wide text-ink-3">
            Total · {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </p>
          <p className="text-[16px] font-bold text-ink">{formatPrice(order.totals.total)}</p>
        </div>
      </div>

      {order.trackingNumber && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
        <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-3">
          Tracking: <span className="font-bold text-ink-2">{order.trackingCarrier ?? 'Carrier'}</span> · {order.trackingNumber}
        </p>
      )}

      <p className="flex items-center gap-1 border-t border-line px-5 py-3 text-[13px] font-bold uppercase tracking-wide text-brand">
        View details
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </p>
    </Link>
  );
}

export function BoxIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7l8-4 8 4v10l-8 4-8-4z" strokeLinejoin="round" />
      <path d="M4 7l8 4 8-4M12 11v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default OrdersList;
