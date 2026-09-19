'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';

function TagIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

const LINK_CLASS =
  'shrink-0 rounded-sm text-[12px] font-bold uppercase tracking-wide text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30';

export interface CouponFormProps {
  /** Controlled "expanded" state (the summary's "Apply Coupon" link opens it). */
  open?: boolean;
  onOpenChange?(open: boolean): void;
}

export function CouponForm({ open: openProp, onOpenChange }: CouponFormProps = {}) {
  const { appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const id = useId();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = applyCoupon(code);
    if (result.ok) {
      setCode('');
      setError(null);
      setOpen(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-3">
        Coupons
      </h2>

      {appliedCoupon ? (
        <div className="flex items-start justify-between gap-3 rounded-sm border border-line px-3 py-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 text-success">
              <TagIcon />
            </span>
            <div className="min-w-0 text-[14px]">
              <p className="font-bold text-ink">
                {appliedCoupon.code}
                <span className="ml-2 font-normal text-success">−{formatPrice(appliedCoupon.discount)}</span>
              </p>
              <p className="mt-0.5 text-[12px] text-ink-3">{appliedCoupon.description}</p>
            </div>
          </div>
          <button type="button" onClick={removeCoupon} className={LINK_CLASS}>
            Remove
          </button>
        </div>
      ) : (
        <div className="rounded-sm border border-line">
          <div className="flex items-center justify-between gap-3 px-3 py-3">
            <span className="flex items-center gap-2.5 text-[14px] font-bold text-ink">
              <span className="text-ink-2">
                <TagIcon />
              </span>
              Apply Coupons
            </span>
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`${id}-form`} className={LINK_CLASS}>
              {open ? 'Close' : 'Apply'}
            </button>
          </div>

          {open && (
            <form id={`${id}-form`} onSubmit={submit} noValidate className="border-t border-line px-3 py-3 animate-fade-in">
              <div className="flex items-start gap-2">
                <Input
                  id={id}
                  aria-label="Coupon code"
                  placeholder="Enter coupon code"
                  value={code}
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="characters"
                  error={error}
                  onChange={(event) => {
                    setCode(event.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  wrapperClassName="flex-1"
                  className="uppercase"
                />
                <Button type="submit" variant="secondary" disabled={code.trim().length === 0}>
                  Apply
                </Button>
              </div>
              <p className="mt-2 text-[12px] text-ink-3">
                Try <span className="font-bold text-ink-2">WELCOME10</span> or <span className="font-bold text-ink-2">FLAT5</span>
              </p>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

export default CouponForm;
