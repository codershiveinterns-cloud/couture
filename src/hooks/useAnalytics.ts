import { useMemo } from 'react';
import { useAllOrders } from '@/hooks/useAllOrders';
import { useCatalog } from '@/hooks/useCatalog';
import { useCustomers } from '@/hooks/useCustomers';
import {
  bestSellers,
  getDashboardStats,
  orderStatusSplit,
  paymentMethodSplit,
  salesByCategory,
  salesByDay,
  type AnalyticsSource,
  type BestSeller,
  type CategorySales,
  type DailySales,
  type DashboardStats,
  type OrderStatusCount,
  type PaymentMethodShare,
} from '@/lib/services/analytics';

/** Live AnalyticsSource (orders + customers + effective catalog) for the pure analytics functions. */
export function useAnalyticsSource(): { source: AnalyticsSource; isHydrated: boolean } {
  const { orders, isHydrated } = useAllOrders();
  const { customers } = useCustomers();
  const { products, categories } = useCatalog();
  const source = useMemo(() => ({ orders, customers, products, categories }), [orders, customers, products, categories]);
  return useMemo(() => ({ source, isHydrated }), [source, isHydrated]);
}

export interface UseDashboardOptions {
  /** Length of the salesByDay series (default 14). */
  days?: number;
  /** Number of best sellers (default 5). */
  bestSellerLimit?: number;
}

export interface UseDashboardResult {
  stats: DashboardStats;
  daily: DailySales[];
  bestSellers: BestSeller[];
  byCategory: CategorySales[];
  byPaymentMethod: PaymentMethodShare[];
  byStatus: OrderStatusCount[];
  /** false during SSR/hydration: everything is empty/zero until then (render skeletons). */
  isHydrated: boolean;
}

/** Everything the admin dashboard needs, recomputed whenever orders, customers or the catalog change. */
export function useDashboard({ days = 14, bestSellerLimit = 5 }: UseDashboardOptions = {}): UseDashboardResult {
  const { source, isHydrated } = useAnalyticsSource();
  return useMemo(
    () => ({
      stats: getDashboardStats(source),
      daily: salesByDay(days, source),
      bestSellers: bestSellers(bestSellerLimit, source),
      byCategory: salesByCategory(source),
      byPaymentMethod: paymentMethodSplit(source),
      byStatus: orderStatusSplit(source),
      isHydrated,
    }),
    [source, days, bestSellerLimit, isHydrated],
  );
}
