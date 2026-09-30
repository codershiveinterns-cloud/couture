'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import FadeImage from '@/components/FadeImage';
import { formatDateTime, InlineFormError, OrderStatusBadge } from '@/components/account/accountUtils';
import { BoxIcon } from '@/components/account/OrdersList';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useAllOrders } from '@/hooks/useAllOrders';
import { formatPrice } from '@/lib/format';
import { ORDER_NUMBER_PREFIX, PAYMENT_METHOD_LABELS } from '@/lib/services/orders';
import type { AdminOrder } from '@/lib/services/types';
import { normalizeEmail } from '@/lib/validation';
import { deliveryEstimate, OrderTimeline } from './OrderTimeline';

interface Query {
  orderNumber: string;
  email: string;
}

const NOT_FOUND_ERROR = "We couldn't find an order with that number and email. Check both and try again — the order number is on your confirmation.";

/** Accepts "ctr-abc123" / "ABC123" / " CTR-ABC123 " -> "CTR-ABC123". */
function normalizeOrderNumber(raw: string): string {
  const value = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!value) return '';
  return value.startsWith(ORDER_NUMBER_PREFIX) ? value : `${ORDER_NUMBER_PREFIX}${value}`;
}

function validate(orderNumber: string, email: string): { orderNumber?: string; email?: string } {
  const errors: { orderNumber?: string; email?: string } = {};
  if (!orderNumber.trim()) errors.orderNumber = 'Enter your order number';
  else if (!/^[A-Z0-9-]{4,20}$/.test(normalizeOrderNumber(orderNumber))) errors.orderNumber = 'That does not look like a Couture order number';
  if (!email.trim()) errors.email = 'Enter the email used for the order';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address';
  return errors;
}

export function TrackOrderView({ initialOrderNumber = '', initialEmail = '' }: { initialOrderNumber?: string; initialEmail?: string }) {
  const { orders, isHydrated } = useAllOrders();
  const { user } = useAuth();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [email, setEmail] = useState(initialEmail);
  const [errors, setErrors] = useState<{ orderNumber?: string; email?: string }>({});
  const [query, setQuery] = useState<Query | null>(() =>
    initialOrderNumber && initialEmail && !Object.keys(validate(initialOrderNumber, initialEmail)).length
      ? { orderNumber: normalizeOrderNumber(initialOrderNumber), email: normalizeEmail(initialEmail) }
      : null,
  );

  const result = useMemo<AdminOrder | null>(() => {
    if (!query) return null;
    return orders.find((o) => o.orderNumber === query.orderNumber && normalizeEmail(o.customer.email) === query.email) ?? null;
  }, [orders, query]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validate(orderNumber, email);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setQuery(null);
      return;
    }
    setQuery({ orderNumber: normalizeOrderNumber(orderNumber), email: normalizeEmail(email) });
  };

  const searched = query !== null && isHydrated;
  const notFound = searched && result === null;
  const isOwn = !!result && !!user && result.userId === user.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink-3">Customer service</p>
        <h1 className="mt-1 text-[24px] font-bold text-ink sm:text-[28px]">Track your order</h1>
        <p className="mt-2 text-[14px] text-ink-2">
          Enter the order number from your confirmation and the email you used at checkout. Signed in?{' '}
          <Link href="/account/orders" className="font-bold text-brand hover:underline">
            See all your orders
          </Link>
          .
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        aria-describedby={notFound ? 'track-error' : undefined}
        className="mt-6 grid gap-4 rounded-sm border border-line bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <Input
          id="track-order-number"
          label="Order number"
          placeholder="CTR-XXXXXXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={orderNumber}
          error={errors.orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="uppercase"
        />
        <Input
          id="track-email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="md" className="sm:mb-0" loading={query !== null && !isHydrated} loadingText="Looking up">
          Track order
        </Button>
      </form>

      {notFound && (
        <div id="track-error" className="mt-4">
          <InlineFormError message={NOT_FOUND_ERROR} />
        </div>
      )}

      {searched && result && <TrackResult order={result} isOwn={isOwn} />}
    </div>
  );
}

function TrackResult({ order, isOwn }: { order: AdminOrder; isOwn: boolean }) {
  const eta = deliveryEstimate(order);
  const hasTracking = !!order.trackingNumber;
  const { totals, address } = order;
  const preview = order.items.slice(0, 4);
  const more = order.items.length - preview.length;

  return (
    <section aria-labelledby="track-result-heading" className="mt-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 id="track-result-heading" className="text-[20px] font-bold text-ink">
            Order {order.orderNumber}
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            Placed {formatDateTime(order.createdAt)} · {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} · {formatPrice(totals.total)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {eta && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-sm bg-surface px-3.5 py-2.5 text-[14px] font-bold text-ink">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
          {eta}
        </p>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="rounded-sm border border-line bg-white p-5">
          <h3 className="mb-4 text-[12px] font-bold uppercase tracking-wide text-ink-3">Order status</h3>
          <OrderTimeline order={order} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-sm border border-line bg-white p-5">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-3">Shipment</h3>
            {hasTracking ? (
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
            ) : (
              <p className="mt-2 text-[13px] text-ink-2">
                {order.status === 'CANCELLED' || order.status === 'REFUNDED'
                  ? 'This order will not ship.'
                  : 'The carrier and tracking number will appear here once the parcel is on its way.'}
              </p>
            )}
            <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-2">
              Delivering to <span className="font-bold text-ink">{address.fullName}</span>, {address.city}, {address.state} {address.postalCode}
            </p>
            <p className="mt-1 text-[13px] text-ink-3">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
              {order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING' ? ` — keep ${formatPrice(totals.total)} ready` : ''}
            </p>
          </div>

          <div className="rounded-sm border border-line bg-white">
            <h3 className="border-b border-line px-5 py-3.5 text-[12px] font-bold uppercase tracking-wide text-ink-3">
              Items ({totals.itemCount})
            </h3>
            <ul className="divide-y divide-line">
              {preview.map((item, i) => (
                <li key={`${item.productId}-${item.variantId ?? 'base'}-${i}`} className="flex items-center gap-3 px-5 py-3">
                  <span className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-sm border border-line bg-surface">
                    {item.image ? (
                      <FadeImage src={item.image} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-ink-4">
                        <BoxIcon size={20} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block text-[13px] font-bold text-ink">{item.name}</span>
                    <span className="block text-[12px] text-ink-3">
                      {item.variantLabel ? `${item.variantLabel} · ` : ''}Qty {item.quantity}
                    </span>
                  </span>
                  <span className="text-[13px] font-bold text-ink">{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
              {more > 0 && <li className="px-5 py-2.5 text-[12px] text-ink-3">+ {more} more {more === 1 ? 'item' : 'items'}</li>}
            </ul>
          </div>

          {isOwn && (
            <Button href={`/account/orders/${order.orderNumber}`} variant="secondary" fullWidth>
              View full order
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export default TrackOrderView;
