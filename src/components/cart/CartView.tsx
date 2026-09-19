'use client';

import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { CartLineItem } from './CartLineItem';
import { OrderSummary, useCheckoutHref } from './OrderSummary';
import { FreeShippingProgress } from './PriceDetails';

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]" aria-busy="true" aria-label="Loading your bag">
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 rounded-sm border border-line bg-white p-4">
            <div className="aspect-[3/4] w-[110px] animate-pulse rounded-sm bg-surface" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-4 w-1/3 animate-pulse rounded-sm bg-surface" />
              <div className="h-3 w-2/3 animate-pulse rounded-sm bg-surface" />
              <div className="h-8 w-20 animate-pulse rounded-sm bg-surface" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-sm border border-line bg-white" />
    </div>
  );
}

/** Mobile-only sticky footer with the total and the PLACE ORDER CTA. */
function MobileCheckoutBar() {
  const { totals } = useCart();
  const { href, disabled } = useCheckoutHref();
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(40,44,63,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">Total</p>
          <p className="text-[16px] font-bold tabular-nums text-ink">{formatPrice(totals.total)}</p>
        </div>
        <Button href={href} disabled={disabled} className="min-w-[160px]">
          Place Order
        </Button>
      </div>
    </div>
  );
}

export function CartView() {
  const { lines, totals, isEmpty, isHydrated, itemCount, clear } = useCart();

  return (
    <div className="bg-canvas">
      <CheckoutHeader stage="bag" />
      <div className={`mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 animate-fade-in ${isHydrated && !isEmpty ? 'pb-24 lg:pb-8' : ''}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-[18px] font-bold text-ink">
            My Bag{' '}
            {isHydrated && (
              <span className="font-normal text-ink-3">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </h1>
          {isHydrated && !isEmpty && (
            <button
              type="button"
              onClick={clear}
              className="rounded-sm text-[12px] font-bold uppercase tracking-wide text-ink-3 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              Clear bag
            </button>
          )}
        </div>

        <div className="mt-5">
          {!isHydrated ? (
            <CartSkeleton />
          ) : isEmpty ? (
            <EmptyState
              title="Hey, it feels so light!"
              description="There is nothing in your bag. Let's add some items."
              action={
                <>
                  <Button href="/wishlist" variant="secondary" className="border-brand text-brand hover:border-brand-dark hover:text-brand-dark">
                    Add items from wishlist
                  </Button>
                  <Button href="/products">Continue shopping</Button>
                </>
              }
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
              <section aria-label="Bag items">
                <div className="mb-4 rounded-sm border border-line bg-white px-4 py-3">
                  <FreeShippingProgress amountToFreeShipping={totals.amountToFreeShipping} qualifies={totals.qualifiesForFreeShipping} />
                </div>
                <ul className="space-y-3">
                  {lines.map((line) => (
                    <CartLineItem key={line.key} line={line} />
                  ))}
                </ul>
              </section>
              <div className="lg:sticky lg:top-24">
                <OrderSummary />
              </div>
            </div>
          )}
        </div>
      </div>
      {isHydrated && !isEmpty && <MobileCheckoutBar />}
    </div>
  );
}

export default CartView;
