'use client';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { buildLoginHref } from '@/lib/safeRedirect';
import { PriceDetails } from './PriceDetails';

export { FreeShippingProgress } from './PriceDetails';

/** Resolves where "PLACE ORDER" on the bag page should go (guests are sent through login first). */
export function useCheckoutHref(): { href: string; disabled: boolean; isGuest: boolean } {
  const { hasStockIssues } = useCart();
  const { status } = useAuth();
  return {
    href: status === 'guest' ? buildLoginHref('/checkout') : '/checkout',
    disabled: hasStockIssues || status === 'loading',
    isGuest: status === 'guest',
  };
}

export function OrderSummary() {
  const { href, disabled, isGuest } = useCheckoutHref();

  return (
    <PriceDetails
      footer={
        <>
          <Button href={href} size="lg" fullWidth disabled={disabled}>
            Place Order
          </Button>
          {isGuest && <p className="mt-3 text-center text-[12px] text-ink-3">You&apos;ll be asked to log in before checkout.</p>}
        </>
      }
    />
  );
}

export default OrderSummary;
