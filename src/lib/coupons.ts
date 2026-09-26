// Coupon SEED data + PURE evaluation. The live, admin-managed coupon list lives in
// services/coupons.ts (localStorage, seeded from COUPONS below).

import { formatPrice } from './format';
import { calculateDiscount, roundMoney, type DiscountRule } from './pricing';

export type CouponType = DiscountRule['type'];

export interface Coupon extends DiscountRule {
  /** Unique, upper-case. */
  code: string;
  description: string;
  /** 'percentage' (value = 1-100) or 'fixed' (value = dollars off). */
  type: CouponType;
  value: number;
  minOrder: number;
  /** Cap for percentage coupons; null = uncapped. */
  maxDiscount: number | null;
  /** ISO date-time; null = never expires. */
  expiresAt: string | null;
  /** Max number of orders that may use the coupon; null = unlimited. */
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
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
    usageLimit: null,
    usedCount: 0,
    active: true,
  },
  {
    code: 'FLAT5',
    description: '$5 off orders of $20+',
    type: 'fixed',
    value: 5,
    minOrder: 20,
    maxDiscount: null,
    expiresAt: null,
    usageLimit: null,
    usedCount: 0,
    active: true,
  },
  {
    code: 'SUMMER25',
    description: '25% off orders of $100+ (up to $50)',
    type: 'percentage',
    value: 25,
    minOrder: 100,
    maxDiscount: 50,
    expiresAt: '2026-08-31T23:59:59.000Z',
    usageLimit: null,
    usedCount: 0,
    active: true,
  },
];

export const COUPON_ERRORS = {
  empty: 'Enter a coupon code',
  notFound: 'Coupon not found',
  inactive: 'This coupon is no longer active',
  expired: 'This coupon has expired',
  usageLimit: 'This coupon has reached its usage limit',
} as const;

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isCouponExpired(coupon: Pick<Coupon, 'expiresAt'>, now: number = Date.now()): boolean {
  if (!coupon.expiresAt) return false;
  const time = new Date(coupon.expiresAt).getTime();
  return Number.isFinite(time) && time < now;
}

export function isCouponExhausted(coupon: Pick<Coupon, 'usageLimit' | 'usedCount'>): boolean {
  return coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;
}

export type CouponValidation =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string; coupon: Coupon | null };

/** Pure: checks existence, active flag, expiry, usage limit and minimum order, in that order. */
export function evaluateCoupon(
  coupons: readonly Coupon[],
  code: string,
  subtotal: number,
  now: number = Date.now(),
): CouponValidation {
  if (!code.trim()) return { ok: false, error: COUPON_ERRORS.empty, coupon: null };
  const normalized = normalizeCouponCode(code);
  const coupon = coupons.find((c) => c.code === normalized);
  if (!coupon) return { ok: false, error: COUPON_ERRORS.notFound, coupon: null };
  if (!coupon.active) return { ok: false, error: COUPON_ERRORS.inactive, coupon };
  if (isCouponExpired(coupon, now)) return { ok: false, error: COUPON_ERRORS.expired, coupon };
  if (isCouponExhausted(coupon)) return { ok: false, error: COUPON_ERRORS.usageLimit, coupon };
  if (subtotal < coupon.minOrder) {
    const shortfall = roundMoney(coupon.minOrder - subtotal);
    return { ok: false, error: `Add ${formatPrice(shortfall)} more to use this coupon`, coupon };
  }
  return { ok: true, coupon, discount: calculateDiscount(coupon, subtotal) };
}

/** "10% off orders of $30+ (up to $25)" style text for coupons created without a description. */
export function describeCoupon(coupon: Pick<Coupon, 'type' | 'value' | 'minOrder' | 'maxDiscount'>): string {
  const amount = coupon.type === 'percentage' ? `${coupon.value}% off` : `${formatPrice(coupon.value)} off`;
  const scope = coupon.minOrder > 0 ? ` orders of ${formatPrice(coupon.minOrder)}+` : ' your order';
  const cap =
    coupon.type === 'percentage' && coupon.maxDiscount !== null ? ` (up to ${formatPrice(coupon.maxDiscount)})` : '';
  return `${amount}${scope}${cap}`;
}
