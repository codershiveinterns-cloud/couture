'use client';

import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { formatAddressLines } from '@/lib/services/addresses';
import { PAYMENT_METHOD_LABELS } from '@/lib/services/orders';
import type { Address, PaymentMethod } from '@/lib/services/types';
import { OrderItemsList } from './OrderItemsList';

export interface ReviewStepProps {
  address: Address;
  paymentMethod: PaymentMethod;
  /** "Visa •••• 4242" / masked UPI id for online methods; null for COD. */
  paymentInstrument: string | null;
  placing: boolean;
  notice: CheckoutNotice | null;
  onRetry(): void;
  onEditStep(step: 0 | 1): void;
  onBack(): void;
  onPlaceOrder(): void;
}

export interface CheckoutNotice {
  /** error = payment failed / order invalid; neutral = the shopper cancelled the payment. */
  tone: 'error' | 'neutral';
  title: string;
  message: string;
  /** Offer "Try again" / "Use a different method" (payment problems only). */
  retryable: boolean;
}

const PANEL = 'rounded-sm border border-line bg-white p-4 sm:p-5';
const PANEL_TITLE = 'text-[12px] font-bold uppercase tracking-wide text-ink-3';

function EditButton({ onClick, label }: { onClick(): void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm text-[12px] font-bold uppercase tracking-wide text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
    >
      {label}
    </button>
  );
}

export function ReviewStep({
  address,
  paymentMethod,
  paymentInstrument,
  placing,
  notice,
  onRetry,
  onEditStep,
  onBack,
  onPlaceOrder,
}: ReviewStepProps) {
  const { lines, totals, appliedCoupon, hasStockIssues } = useCart();
  const addressLines = formatAddressLines(address);
  const isOnline = paymentMethod !== 'COD';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-bold text-ink">Review your order</h2>
        <p className="mt-1 text-[13px] text-ink-3">Double-check everything before placing your order.</p>
      </div>

      <section aria-labelledby="review-items" className={PANEL}>
        <div className="mb-3 flex items-center justify-between">
          <h3 id="review-items" className={PANEL_TITLE}>
            Items ({totals.itemCount})
          </h3>
          <Button href="/cart" variant="ghost" size="sm" className="px-0">
            Edit bag
          </Button>
        </div>
        <OrderItemsList items={lines} />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="review-address" className={PANEL}>
          <div className="mb-2 flex items-center justify-between">
            <h3 id="review-address" className={PANEL_TITLE}>
              Deliver to
            </h3>
            <EditButton onClick={() => onEditStep(0)} label="Change" />
          </div>
          <p className="text-[14px] font-bold text-ink">{address.fullName}</p>
          {addressLines.map((line) => (
            <p key={line} className="text-[13px] text-ink-2">
              {line}
            </p>
          ))}
          <p className="mt-1.5 text-[13px] text-ink-2">
            Mobile: <span className="font-bold text-ink">{address.phone}</span>
          </p>
        </section>

        <section aria-labelledby="review-payment" className={PANEL}>
          <div className="mb-2 flex items-center justify-between">
            <h3 id="review-payment" className={PANEL_TITLE}>
              Payment
            </h3>
            <EditButton onClick={() => onEditStep(1)} label="Change" />
          </div>
          <p className="text-[14px] font-bold text-ink">{PAYMENT_METHOD_LABELS[paymentMethod]}</p>
          {isOnline ? (
            <>
              {paymentInstrument && <p className="text-[13px] font-medium text-ink-2">{paymentInstrument}</p>}
              <p className="text-[13px] text-ink-2">You will be charged {formatPrice(totals.total)} when you place the order.</p>
            </>
          ) : (
            <p className="text-[13px] text-ink-2">Payment is collected when your order arrives.</p>
          )}
          {appliedCoupon && (
            <p className="mt-3 text-[12px] text-success">
              Coupon <span className="font-bold">{appliedCoupon.code}</span> applied — {appliedCoupon.description}
            </p>
          )}
        </section>
      </div>

      {notice && (
        <div
          role="alert"
          className={`rounded-sm border px-4 py-3.5 ${
            notice.tone === 'error' ? 'border-brand/40 bg-brand-light' : 'border-line-strong bg-surface'
          }`}
        >
          <p className={`text-[14px] font-bold ${notice.tone === 'error' ? 'text-brand-dark' : 'text-ink'}`}>{notice.title}</p>
          <p className="mt-0.5 text-[13px] text-ink-2">{notice.message}</p>
          {notice.retryable && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={onRetry} disabled={hasStockIssues}>
                Try again
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onEditStep(1)}>
                Use a different method
              </Button>
            </div>
          )}
        </div>
      )}

      {hasStockIssues && (
        <p role="alert" className="rounded-sm bg-brand-light px-4 py-3 text-[13px] font-medium text-brand">
          Some items are out of stock or exceed the available quantity. Please update your bag.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack} disabled={placing} className="px-0">
          Back
        </Button>
        <Button size="lg" onClick={onPlaceOrder} loading={placing} loadingText="Placing order…" disabled={hasStockIssues} className="sm:min-w-[220px]">
          {isOnline ? `Pay ${formatPrice(totals.total)} & place order` : 'Place order'}
        </Button>
      </div>
    </div>
  );
}

export default ReviewStep;
