import { useMemo, useSyncExternalStore } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import { getServerAllOrders, listAllOrders, subscribeAllOrders } from '@/lib/services/orders';
import { paymentsStore } from '@/lib/services/payments';
import type { AdminOrder, PaymentRecord } from '@/lib/services/types';
import { useJsonStore } from './useJsonStore';

export interface UseAllOrdersResult {
  /** Every order across all customers, newest first, joined with { customer: { id, name, email } }. */
  orders: readonly AdminOrder[];
  /** false during SSR/hydration (orders is [] until then). */
  isHydrated: boolean;
  getOrder(orderNumber: string): AdminOrder | undefined;
}

/** Admin: live list of all orders. Mutations are plain service calls (updateOrderStatus, setTracking, …). */
export function useAllOrders(): UseAllOrdersResult {
  const orders = useSyncExternalStore(subscribeAllOrders, listAllOrders, getServerAllOrders);
  const isHydrated = useHydrated();
  return useMemo(
    () => ({
      orders,
      isHydrated,
      getOrder: (orderNumber) => {
        const wanted = orderNumber.trim().toUpperCase();
        return orders.find((o) => o.orderNumber === wanted);
      },
    }),
    [orders, isHydrated],
  );
}

/** Admin: one order (null when missing) that re-renders on every change. */
export function useAdminOrder(orderNumber: string | null | undefined): { order: AdminOrder | null; isHydrated: boolean } {
  const { orders, isHydrated } = useAllOrders();
  const order = useMemo(() => {
    if (!orderNumber) return null;
    const wanted = orderNumber.trim().toUpperCase();
    return orders.find((o) => o.orderNumber === wanted) ?? null;
  }, [orders, orderNumber]);
  return { order, isHydrated };
}

/** Live payment records (every attempt, newest first). */
export function usePayments(): { payments: readonly PaymentRecord[]; isHydrated: boolean } {
  const payments = useJsonStore(paymentsStore());
  const isHydrated = useHydrated();
  return useMemo(() => ({ payments, isHydrated }), [payments, isHydrated]);
}

/** Live payment for one order (the PAID/PENDING attempt when several share the number). */
export function useOrderPayment(orderNumber: string | null | undefined): PaymentRecord | null {
  const { payments } = usePayments();
  return useMemo(() => {
    if (!orderNumber) return null;
    const wanted = orderNumber.trim().toUpperCase();
    const matches = payments.filter((p) => p.orderNumber === wanted);
    return matches.find((p) => p.status !== 'FAILED' && p.status !== 'CANCELLED') ?? matches[0] ?? null;
  }, [payments, orderNumber]);
}
