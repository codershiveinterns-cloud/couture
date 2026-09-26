import { useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  cancelOrder,
  getUserOrderByNumber,
  ordersStore,
  payAndPlaceOrder,
  placeOrder,
  type CheckoutPaymentInput,
  type CheckoutResult,
  type PayAndPlaceOrderOptions,
  type PlaceOrderInput,
} from '@/lib/services/orders';
import type { Order, ServiceResult } from '@/lib/services/types';

const EMPTY: readonly Order[] = [];
const noopSubscribe = () => () => {};
const getEmpty = () => EMPTY;
const SIGNED_OUT = { ok: false as const, error: 'Please sign in to place an order' };
const SIGNED_OUT_CHECKOUT = { ...SIGNED_OUT, code: 'ORDER_INVALID' as const };

export interface UseOrdersResult {
  /** Newest first. Reflects admin updates (status, tracking, refunds) immediately: same storage. */
  orders: readonly Order[];
  isReady: boolean;
  isAuthenticated: boolean;
  getOrder(orderNumber: string): Order | undefined;
  /** Cash on Delivery only (Milestone 2 API). Validates everything again, stores the order, clears the cart + coupon. */
  placeOrder(input: PlaceOrderInput): Promise<ServiceResult<Order>>;
  /** Every payment method: collects the payment first; on failure/cancel no order is created and the bag is intact. */
  payAndPlaceOrder(input: CheckoutPaymentInput, options?: PayAndPlaceOrderOptions): Promise<CheckoutResult>;
  /** Customer cancellation: own orders only, before they ship. Restores stock. */
  cancelOrder(orderNumber: string, reason?: string): ServiceResult<Order>;
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
      getOrder: (orderNumber) => (userId ? getUserOrderByNumber(userId, orderNumber) : undefined),
      placeOrder: (input) => (userId ? placeOrder(userId, input) : Promise.resolve(SIGNED_OUT)),
      payAndPlaceOrder: (input, options) =>
        userId ? payAndPlaceOrder(userId, input, options) : Promise.resolve(SIGNED_OUT_CHECKOUT),
      cancelOrder: (orderNumber, reason) =>
        userId ? cancelOrder(orderNumber, reason, { byUserId: userId }) : SIGNED_OUT,
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
