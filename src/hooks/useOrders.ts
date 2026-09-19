import { useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getOrderByNumber, ordersStore, placeOrder, type PlaceOrderInput } from '@/lib/services/orders';
import type { Order, ServiceResult } from '@/lib/services/types';

const EMPTY: readonly Order[] = [];
const noopSubscribe = () => () => {};
const getEmpty = () => EMPTY;
const SIGNED_OUT = { ok: false as const, error: 'Please sign in to place an order' };

export interface UseOrdersResult {
  /** Newest first. */
  orders: readonly Order[];
  isReady: boolean;
  isAuthenticated: boolean;
  getOrder(orderNumber: string): Order | undefined;
  /** Validates everything again, stores the order, clears the cart + coupon. */
  placeOrder(input: PlaceOrderInput): Promise<ServiceResult<Order>>;
}

export function useOrders(): UseOrdersResult {
  const { user, status } = useAuth();
  const userId = user?.id ?? null;
  const store = useMemo(() => (userId ? ordersStore(userId) : null), [userId]);
  const orders = useSyncExternalStore<readonly Order[]>(
    store ? store.subscribe : noopSubscribe,
    store ? store.get : getEmpty,
    getEmpty,
  );

  return useMemo<UseOrdersResult>(
    () => ({
      orders,
      isReady: status !== 'loading',
      isAuthenticated: !!userId,
      getOrder: (orderNumber) => (userId ? getOrderByNumber(userId, orderNumber) : undefined),
      placeOrder: (input) => (userId ? placeOrder(userId, input) : Promise.resolve(SIGNED_OUT)),
    }),
    [orders, status, userId],
  );
}

export function useOrder(orderNumber: string | null | undefined): { order: Order | null; isReady: boolean } {
  const { orders, isReady } = useOrders();
  const order = useMemo(() => {
    if (!orderNumber) return null;
    const wanted = orderNumber.trim().toUpperCase();
    return orders.find((o) => o.orderNumber === wanted) ?? null;
  }, [orders, orderNumber]);
  return { order, isReady };
}
