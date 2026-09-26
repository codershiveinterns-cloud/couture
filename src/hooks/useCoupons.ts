import { useMemo } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import type { Coupon } from '@/lib/coupons';
import { couponsStore } from '@/lib/services/coupons';
import { useJsonStore } from './useJsonStore';

export interface UseCouponsResult {
  /** Every admin-managed coupon (active or not). The seed list during SSR/hydration and until first write. */
  coupons: readonly Coupon[];
  isHydrated: boolean;
  getCoupon(code: string): Coupon | undefined;
}

/** Live coupon list. Mutations are plain service calls (createCoupon, updateCoupon, toggleCouponActive, deleteCoupon). */
export function useCoupons(): UseCouponsResult {
  const coupons = useJsonStore(couponsStore());
  const isHydrated = useHydrated();
  return useMemo(
    () => ({
      coupons,
      isHydrated,
      getCoupon: (code) => coupons.find((c) => c.code === code.trim().toUpperCase()),
    }),
    [coupons, isHydrated],
  );
}
