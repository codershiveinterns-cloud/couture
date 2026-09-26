'use client';

import { useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { TotalsTable } from '@/components/cart/TotalsTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { useOrderPayment } from '@/hooks/useAllOrders';
import { useOrder } from '@/hooks/useOrders';
import { formatAddressLines } from '@/lib/services/addresses';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/services/orders';
import { describePaymentInstrument } from '@/lib/services/payments';
import { ORDER_STATUS_VARIANTS, PAYMENT_STATUS_VARIANTS } from '@/components/account/accountUtils';
import { OrderItemsList } from './OrderItemsList';

const NEXT_STEPS_COD = [
  'We’re preparing your items and will confirm the order shortly.',
  'You can track the status anytime from your account’s orders page.',
  'Have the exact amount ready — payment is collected in cash on delivery.',
];

const NEXT_STEPS_PAID = [
  'Your payment is confirmed and the order is now being prepared.',
  'You can track the status anytime from your account’s orders page.',
  'Nothing more to pay — just be available to receive the delivery.',
];

const PANEL = 'rounded-sm border border-line bg-white p-4 sm:p-5';
const PANEL_TITLE = 'mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-3';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const { order, isReady } = useOrder(orderNumber);
  const payment = useOrderPayment(order?.orderNumber ?? null);
  const { user } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-ink-4">
        <Spinner size="lg" label="Loading your order" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        title={orderNumber ? 'We couldn’t find that order' : 'No order to show'}
        description={
          orderNumber
            ? `Order ${orderNumber.toUpperCase()} isn’t in your account. It may belong to another account or the link may be incomplete.`
            : 'Open this page from a completed checkout, or view your orders from your account.'
        }
        action={
          <>
            <Button href="/account/orders" variant="secondary">
              View my orders
            </Button>
            <Button href="/products">Continue shopping</Button>
          </>
        }
      />
    );
  }

  const addressLines = formatAddressLines(order.address);
  const isPaid = order.paymentStatus === 'PAID';
  const awaitingCod = order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING';
  const paymentLabel = awaitingCod ? 'Pay on delivery' : PAYMENT_STATUS_LABELS[order.paymentStatus];
  const instrument = payment ? describePaymentInstrument(payment) : PAYMENT_METHOD_LABELS[order.paymentMethod];
  const nextSteps = isPaid ? NEXT_STEPS_PAID : NEXT_STEPS_COD;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="flex flex-col gap-6">
        <section className="rounded-sm border border-line bg-white p-6 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-white">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h1 className="mt-5 text-[22px] font-bold text-ink sm:text-[24px]">{isPaid ? 'Payment received — order confirmed!' : 'Order placed successfully!'}</h1>
            <p className="mt-2 text-[14px] text-ink-2">
              Order number <span className="font-bold text-ink">{order.orderNumber}</span> · {formatDate(order.createdAt)}
            </p>
            {user?.email && (
              <p className="mt-1 text-[13px] text-ink-3">
                We&apos;ve emailed the confirmation to <span className="font-bold text-ink-2">{user.email}</span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Badge variant={ORDER_STATUS_VARIANTS[order.status]} dot>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              <Badge variant={PAYMENT_STATUS_VARIANTS[order.paymentStatus]} dot>
                {paymentLabel}
              </Badge>
            </div>
            <p className="mt-3 text-[13px] text-ink-2">
              {isPaid ? 'Paid with' : 'Payment'}: <span className="font-bold text-ink">{instrument}</span>
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button href={`/account/orders/${order.orderNumber}`} variant="secondary" className="sm:min-w-[180px]">
              View order
            </Button>
            <Button href="/products" className="sm:min-w-[180px]">
              Continue shopping
            </Button>
          </div>
        </section>

        <section aria-labelledby="success-items" className={PANEL}>
          <h2 id="success-items" className={PANEL_TITLE}>
            Items ({order.totals.itemCount})
          </h2>
          <OrderItemsList items={order.items} />
        </section>

        <section aria-labelledby="success-next" className={PANEL}>
          <h2 id="success-next" className={PANEL_TITLE}>
            What happens next
          </h2>
          <ol className="space-y-2.5 text-[13px] text-ink-2">
            {nextSteps.map((text, index) => (
              <li key={text} className="flex gap-3">
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-ink">
                  {index + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-24">
        <section aria-labelledby="success-totals" className={PANEL}>
          <h2 id="success-totals" className={PANEL_TITLE}>
            Price Details ({order.totals.itemCount} {order.totals.itemCount === 1 ? 'Item' : 'Items'})
          </h2>
          <TotalsTable
            subtotal={order.totals.subtotal}
            discount={order.totals.discount}
            shipping={order.totals.shipping}
            tax={order.totals.tax}
            total={order.totals.total}
            couponCode={order.couponCode}
          />
          <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-[12px] text-ink-3">
            <div className="flex items-center justify-between gap-3">
              <dt>Payment method</dt>
              <dd className="text-right font-bold text-ink-2">{instrument}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Payment status</dt>
              <dd>
                <Badge variant={PAYMENT_STATUS_VARIANTS[order.paymentStatus]} size="sm">
                  {paymentLabel}
                </Badge>
              </dd>
            </div>
            {payment?.reference && (
              <div className="flex items-center justify-between gap-3">
                <dt>Reference</dt>
                <dd className="break-all text-right font-medium tabular-nums text-ink-2">{payment.reference}</dd>
              </div>
            )}
          </dl>
        </section>

        <section aria-labelledby="success-address" className={PANEL}>
          <h2 id="success-address" className={PANEL_TITLE}>
            Deliver to
          </h2>
          <p className="text-[14px] font-bold text-ink">{order.address.fullName}</p>
          {addressLines.map((line) => (
            <p key={line} className="text-[13px] text-ink-2">
              {line}
            </p>
          ))}
          <p className="mt-1.5 text-[13px] text-ink-2">
            Mobile: <span className="font-bold text-ink">{order.address.phone}</span>
          </p>
        </section>
      </div>
    </div>
  );
}

export function CheckoutSuccess() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 animate-fade-in">
      <RequireAuth>
        <SuccessContent />
      </RequireAuth>
    </div>
  );
}

export default CheckoutSuccess;
