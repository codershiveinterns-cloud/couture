import { formatPrice } from '@/lib/format';

export interface TotalsTableProps {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  /** Sum of MRP × qty; when higher than the subtotal a green "Discount on MRP" row is shown. */
  totalMrp?: number;
  /** When provided and no coupon is applied, renders an "Apply Coupon" link in the coupon row. */
  onApplyCoupon?(): void;
  className?: string;
}

const ROW = 'flex items-baseline justify-between gap-4';

export function TotalsTable({ subtotal, discount, shipping, tax, total, couponCode, totalMrp, onApplyCoupon, className = '' }: TotalsTableProps) {
  const mrp = totalMrp !== undefined && totalMrp > subtotal ? totalMrp : subtotal;
  const mrpDiscount = Math.round((mrp - subtotal) * 100) / 100;

  return (
    <dl className={`space-y-3 text-[14px] text-ink-2 ${className}`}>
      <div className={ROW}>
        <dt>Total MRP</dt>
        <dd className="tabular-nums text-ink">{formatPrice(mrp)}</dd>
      </div>
      {mrpDiscount > 0 && (
        <div className={ROW}>
          <dt>Discount on MRP</dt>
          <dd className="tabular-nums text-success">−{formatPrice(mrpDiscount)}</dd>
        </div>
      )}
      <div className={ROW}>
        <dt>Coupon Discount{discount > 0 && couponCode ? <span className="ml-1 text-[12px] text-ink-3">({couponCode})</span> : null}</dt>
        <dd className="tabular-nums">
          {discount > 0 ? (
            <span className="text-success">−{formatPrice(discount)}</span>
          ) : onApplyCoupon ? (
            <button
              type="button"
              onClick={onApplyCoupon}
              className="rounded-sm text-[14px] font-bold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              Apply Coupon
            </button>
          ) : (
            <span className="text-ink">{formatPrice(0)}</span>
          )}
        </dd>
      </div>
      <div className={ROW}>
        <dt>Shipping Fee</dt>
        <dd className="tabular-nums">
          {shipping === 0 ? <span className="font-bold text-success">FREE</span> : <span className="text-ink">{formatPrice(shipping)}</span>}
        </dd>
      </div>
      <div className={ROW}>
        <dt>Platform &amp; Tax (8%)</dt>
        <dd className="tabular-nums text-ink">{formatPrice(tax)}</dd>
      </div>
      <div className={`${ROW} border-t border-line pt-3`}>
        <dt className="text-[15px] font-bold text-ink">Total Amount</dt>
        <dd className="text-[15px] font-bold tabular-nums text-ink">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}

export default TotalsTable;
