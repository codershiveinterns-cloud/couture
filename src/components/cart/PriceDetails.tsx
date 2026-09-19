'use client';

import { useState, type ReactNode } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/pricing';
import { CouponForm } from './CouponForm';
import { computeMrpTotal } from './priceUtils';
import { TotalsTable } from './TotalsTable';

export function FreeShippingProgress({ amountToFreeShipping, qualifies }: { amountToFreeShipping: number; qualifies: boolean }) {
  const progress = qualifies ? 100 : Math.min(100, Math.round(((FREE_SHIPPING_THRESHOLD - amountToFreeShipping) / FREE_SHIPPING_THRESHOLD) * 100));
  return (
    <div>
      <p className={`text-[12px] font-bold ${qualifies ? 'text-success' : 'text-ink-2'}`} aria-live="polite">
        {qualifies ? "You've unlocked FREE shipping" : `Add ${formatPrice(amountToFreeShipping)} more for FREE shipping`}
      </p>
      <div
        role="progressbar"
        aria-label="Progress to free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-line"
      >
        <div className={`h-full transition-all duration-300 ${qualifies ? 'bg-success' : 'bg-brand'}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export interface PriceDetailsProps {
  /** Show the COUPONS row above the price table (default true). */
  showCoupon?: boolean;
  /** Show the free-shipping progress line (default false — the bag page shows it above the items). */
  showShippingProgress?: boolean;
  /** Rendered under the totals (e.g. the PLACE ORDER button). */
  footer?: ReactNode;
  className?: string;
}

/** Myntra-style sticky right panel: COUPONS + PRICE DETAILS (n Items). Shared by the bag and checkout pages. */
export function PriceDetails({ showCoupon = true, showShippingProgress = false, footer, className = '' }: PriceDetailsProps) {
  const { lines, totals, appliedCoupon, hasStockIssues, itemCount } = useCart();
  const [couponOpen, setCouponOpen] = useState(false);

  return (
    <aside className={`rounded-sm border border-line bg-white p-4 sm:p-5 ${className}`} aria-labelledby="price-details-heading">
      {showCoupon && <CouponForm open={couponOpen} onOpenChange={setCouponOpen} />}

      {showShippingProgress && (
        <div className={showCoupon ? 'mt-5 border-t border-line pt-4' : ''}>
          <FreeShippingProgress amountToFreeShipping={totals.amountToFreeShipping} qualifies={totals.qualifiesForFreeShipping} />
        </div>
      )}

      <h2
        id="price-details-heading"
        className={`text-[12px] font-bold uppercase tracking-wide text-ink-3 ${showCoupon || showShippingProgress ? 'mt-5 border-t border-line pt-4' : ''}`}
      >
        Price Details ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
      </h2>
      <TotalsTable
        className="mt-3"
        subtotal={totals.subtotal}
        discount={totals.discount}
        shipping={totals.shipping}
        tax={totals.tax}
        total={totals.total}
        couponCode={appliedCoupon?.code}
        totalMrp={computeMrpTotal(lines)}
        onApplyCoupon={showCoupon ? () => setCouponOpen(true) : undefined}
      />

      {hasStockIssues && (
        <p role="alert" className="mt-4 rounded-sm bg-brand-light px-3 py-2 text-[12px] font-medium text-brand">
          Some items are out of stock or exceed the available quantity. Update them before placing your order.
        </p>
      )}

      {footer && <div className="mt-5">{footer}</div>}
    </aside>
  );
}

export default PriceDetails;
