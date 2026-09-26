// Admin-managed coupons, persisted in localStorage and seeded from lib/coupons.ts (COUPONS).
// While nothing has been written, the store's fallback IS the seed list, so WELCOME10 / FLAT5 /
// SUMMER25 work out of the box. The first admin change (or coupon use) persists the full list.

import {
  COUPONS,
  describeCoupon,
  evaluateCoupon,
  isCouponExhausted,
  isCouponExpired,
  normalizeCouponCode,
  type Coupon,
  type CouponType,
  type CouponValidation,
} from '../coupons';
import { roundMoney } from '../pricing';
import { getJsonStore, isRecord, sanitizeArray, storageKeys } from '../storage';
import { hasErrors, type FieldErrors } from '../validation';
import type { ServiceResult } from './types';

const SEED: Coupon[] = COUPONS.map((coupon) => ({ ...coupon }));
const COUPON_FORM_ERROR = 'Please fix the highlighted fields';
export const COUPON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,19}$/;

function isCoupon(value: unknown): value is Coupon {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.description === 'string' &&
    (value.type === 'percentage' || value.type === 'fixed') &&
    typeof value.value === 'number' &&
    typeof value.minOrder === 'number' &&
    (value.maxDiscount === null || typeof value.maxDiscount === 'number') &&
    (value.expiresAt === null || typeof value.expiresAt === 'string') &&
    (value.usageLimit === null || typeof value.usageLimit === 'number') &&
    typeof value.usedCount === 'number' &&
    typeof value.active === 'boolean'
  );
}

export function couponsStore() {
  return getJsonStore(storageKeys.coupons, SEED, (v) => sanitizeArray(v, isCoupon));
}

/** Every coupon (active or not), in creation order. Stable reference until the store changes. */
export function getCoupons(): readonly Coupon[] {
  return couponsStore().get();
}

export function getCoupon(code: string): Coupon | undefined {
  const normalized = normalizeCouponCode(code);
  return getCoupons().find((coupon) => coupon.code === normalized);
}

/** Evaluates `code` against the admin-managed store: active, expiry, usage limit, minimum order. */
export function validateCoupon(
  code: string,
  subtotal: number,
  now: number = Date.now(),
  coupons: readonly Coupon[] = getCoupons(),
): CouponValidation {
  return evaluateCoupon(coupons, code, subtotal, now);
}

export type CouponLifecycle = 'active' | 'inactive' | 'expired' | 'exhausted';

/** Display state for admin tables: inactive > expired > exhausted > active. */
export function couponLifecycle(coupon: Coupon, now: number = Date.now()): CouponLifecycle {
  if (!coupon.active) return 'inactive';
  if (isCouponExpired(coupon, now)) return 'expired';
  if (isCouponExhausted(coupon)) return 'exhausted';
  return 'active';
}

export interface CouponInput {
  code: string;
  /** Auto-generated from the rule when blank. */
  description: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  /** ISO date-time or a yyyy-mm-dd date (treated as end of that day, UTC); null = never. */
  expiresAt: string | null;
  usageLimit: number | null;
  active: boolean;
}

export type CouponField = keyof CouponInput;

export const EMPTY_COUPON_INPUT: CouponInput = {
  code: '',
  description: '',
  type: 'percentage',
  value: 10,
  minOrder: 0,
  maxDiscount: null,
  expiresAt: null,
  usageLimit: null,
  active: true,
};

export function couponToInput(coupon: Coupon): CouponInput {
  return {
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    minOrder: coupon.minOrder,
    maxDiscount: coupon.maxDiscount,
    expiresAt: coupon.expiresAt,
    usageLimit: coupon.usageLimit,
    active: coupon.active,
  };
}

function normalizeExpiry(value: string | null): string | null {
  if (value === null || !value.trim()) return null;
  const trimmed = value.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T23:59:59.000Z` : trimmed;
  const time = new Date(iso).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : 'invalid';
}

export function validateCouponInput(input: CouponInput, existingCode: string | null = null): FieldErrors<CouponField> {
  const errors: FieldErrors<CouponField> = {};
  const code = normalizeCouponCode(input.code);
  if (!code) errors.code = 'Coupon code is required';
  else if (!COUPON_CODE_PATTERN.test(code)) errors.code = 'Use 3-20 letters, numbers, dashes or underscores';
  else if (code !== existingCode && getCoupon(code)) errors.code = 'A coupon with this code already exists';

  if (input.type !== 'percentage' && input.type !== 'fixed') errors.type = 'Select a discount type';
  if (typeof input.value !== 'number' || !Number.isFinite(input.value) || input.value <= 0) {
    errors.value = 'Discount value must be greater than 0';
  } else if (input.type === 'percentage' && input.value > 100) {
    errors.value = 'Percentage must be between 1 and 100';
  } else if (input.type === 'fixed' && input.value > 10_000) {
    errors.value = 'Fixed discount is too large';
  }

  if (typeof input.minOrder !== 'number' || !Number.isFinite(input.minOrder) || input.minOrder < 0) {
    errors.minOrder = 'Minimum order must be 0 or more';
  } else if (input.type === 'fixed' && !errors.value && input.minOrder < input.value) {
    errors.minOrder = 'Minimum order must be at least the discount amount';
  }

  if (input.maxDiscount !== null && (!Number.isFinite(input.maxDiscount) || input.maxDiscount <= 0)) {
    errors.maxDiscount = 'Maximum discount must be greater than 0 (or empty)';
  }
  if (input.usageLimit !== null && (!Number.isInteger(input.usageLimit) || input.usageLimit < 1)) {
    errors.usageLimit = 'Usage limit must be a whole number of 1 or more (or empty)';
  }
  if (normalizeExpiry(input.expiresAt) === 'invalid') errors.expiresAt = 'Enter a valid expiry date';
  if (input.description.trim().length > 140) errors.description = 'Description must be 140 characters or fewer';
  return errors;
}

function buildCoupon(input: CouponInput, usedCount: number): Coupon {
  const rule = {
    type: input.type,
    value: roundMoney(input.value),
    minOrder: roundMoney(input.minOrder),
    maxDiscount: input.type === 'percentage' && input.maxDiscount !== null ? roundMoney(input.maxDiscount) : null,
  };
  return {
    code: normalizeCouponCode(input.code),
    description: input.description.trim() || describeCoupon(rule),
    ...rule,
    expiresAt: normalizeExpiry(input.expiresAt),
    usageLimit: input.usageLimit,
    usedCount,
    active: !!input.active,
  };
}

export function createCoupon(input: CouponInput): ServiceResult<Coupon> {
  const fieldErrors = validateCouponInput(input, null);
  if (hasErrors(fieldErrors)) return { ok: false, error: COUPON_FORM_ERROR, fieldErrors };
  const coupon = buildCoupon(input, 0);
  couponsStore().set([...getCoupons(), coupon]);
  return { ok: true, data: coupon };
}

/** `code` identifies the coupon; the patch may rename it (uniqueness is re-checked). usedCount is preserved. */
export function updateCoupon(code: string, patch: Partial<CouponInput>): ServiceResult<Coupon> {
  const existing = getCoupon(code);
  if (!existing) return { ok: false, error: 'Coupon not found' };
  const input: CouponInput = { ...couponToInput(existing), ...patch };
  const fieldErrors = validateCouponInput(input, existing.code);
  if (hasErrors(fieldErrors)) return { ok: false, error: COUPON_FORM_ERROR, fieldErrors };
  const coupon = buildCoupon(input, existing.usedCount);
  couponsStore().set(getCoupons().map((c) => (c.code === existing.code ? coupon : c)));
  return { ok: true, data: coupon };
}

export function deleteCoupon(code: string): ServiceResult {
  const existing = getCoupon(code);
  if (!existing) return { ok: false, error: 'Coupon not found' };
  couponsStore().set(getCoupons().filter((c) => c.code !== existing.code));
  return { ok: true, data: undefined };
}

/** Pass `active` to force a state; omit to toggle. */
export function toggleCouponActive(code: string, active?: boolean): ServiceResult<Coupon> {
  const existing = getCoupon(code);
  if (!existing) return { ok: false, error: 'Coupon not found' };
  const coupon: Coupon = { ...existing, active: active ?? !existing.active };
  couponsStore().set(getCoupons().map((c) => (c.code === existing.code ? coupon : c)));
  return { ok: true, data: coupon };
}

/** Called by the orders service when an order that used `code` is placed (+1) or seeded. */
export function recordCouponUse(code: string | null | undefined, times = 1): void {
  if (!code) return;
  const existing = getCoupon(code);
  if (!existing || times <= 0) return;
  couponsStore().set(
    getCoupons().map((c) => (c.code === existing.code ? { ...c, usedCount: c.usedCount + Math.floor(times) } : c)),
  );
}

/** Demo reset: back to the seed list with zero usage. */
export function resetCoupons(): void {
  couponsStore().clear();
}
