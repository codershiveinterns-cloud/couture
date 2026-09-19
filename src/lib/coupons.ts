import { formatPrice } from './format';
import { calculateDiscount, roundMoney, type DiscountRule } from './pricing';

export interface Coupon extends DiscountRule {
  code: string;
  description: string;
  minOrder: number;
  expiresAt: string | null;
}

export const COUPONS: readonly Coupon[] = [
  {
    code: 'WELCOME10',
    description: '10% off orders of $30+ (up to $25)',
    type: 'percentage',
    value: 10,
    minOrder: 30,
    maxDiscount: 25,
    expiresAt: null,
  },
  {
    code: 'FLAT5',
    description: '$5 off orders of $20+',
    type: 'fixed',
    value: 5,
    minOrder: 20,
    maxDiscount: null,
    expiresAt: null,
  },
  {
    code: 'SUMMER25',
    description: '25% off orders of $100+ (up to $50)',
    type: 'percentage',
    value: 25,
    minOrder: 100,
    maxDiscount: 50,
    expiresAt: '2026-08-31T23:59:59.000Z',
  },
];

export const COUPON_ERRORS = {
  empty: 'Enter a coupon code',
  notFound: 'Coupon not found',
  expired: 'This coupon has expired',
} as const;

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function findCoupon(code: string): Coupon | undefined {
  const normalized = normalizeCouponCode(code);
  return COUPONS.find((coupon) => coupon.code === normalized);
}

export type CouponValidation =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string; coupon: Coupon | null };

export function validateCoupon(code: string, subtotal: number, now: number = Date.now()): CouponValidation {
  if (!code.trim()) return { ok: false, error: COUPON_ERRORS.empty, coupon: null };
  const coupon = findCoupon(code);
  if (!coupon) return { ok: false, error: COUPON_ERRORS.notFound, coupon: null };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) {
    return { ok: false, error: COUPON_ERRORS.expired, coupon };
  }
  if (subtotal < coupon.minOrder) {
    const shortfall = roundMoney(coupon.minOrder - subtotal);
    return { ok: false, error: `Add ${formatPrice(shortfall)} more to use this coupon`, coupon };
  }
  return { ok: true, coupon, discount: calculateDiscount(coupon, subtotal) };
}
