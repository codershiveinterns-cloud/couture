// Orders + the order <-> payment flow. Orders stay in per-user keys (`orders:<userId>`), so the
// customer's order history and the admin views read the SAME storage: an admin status update shows up
// in the customer's account immediately. Swap point for a real API: each exported function maps to
// one endpoint (POST /orders, PATCH /admin/orders/:number/status, POST /admin/orders/:number/refund…).

import type { Coupon } from '../coupons';
import { validateCardDetails, validateUpiId, type CardDetails, type PaymentField } from '../payments/cards';
import { activeGateway, type PaymentIntent, type PaymentMethodDetails } from '../payments/gateway';
import { calculateTotals } from '../pricing';
import { getJsonStore, isRecord, sanitizeArray, storageKeys, subscribeKey, subscribePrefix } from '../storage';
import { hasErrors, validateAddressInput, type FieldErrors } from '../validation';
import { addressToInput, getAddress, toAddressSnapshot } from './addresses';
import { usersStore } from './auth';
import { buildCartLines, clearCart, getCartCouponCode, getCartItems, setCartCouponCode, type CartLine } from './cart';
import { adjustStock } from './catalogStore';
import { recordCouponUse, validateCoupon } from './coupons';
import { randomBase36, randomId } from './crypto';
import { COD_GATEWAY_ID, createPaymentForOrder, getPaymentById, getPaymentByOrder, setPaymentStatus } from './payments';
import type {
  Address,
  AdminOrder,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusEvent,
  PaymentMethod,
  PaymentStatus,
  ServiceResult,
  StoredUser,
} from './types';

export const ORDER_NUMBER_PREFIX = 'CTR-';
const PLACE_ORDER_LATENCY_MS = 700;

export interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  description: string;
  available: boolean;
  note: string | null;
}

export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  {
    id: 'COD',
    label: 'Cash on Delivery',
    description: 'Pay in cash when your order arrives.',
    available: true,
    note: null,
  },
  {
    id: 'CARD',
    label: 'Card',
    description: 'Visa, Mastercard, American Express',
    available: true,
    note: null,
  },
  {
    id: 'UPI',
    label: 'UPI / Wallet',
    description: 'UPI apps and digital wallets',
    available: true,
    note: null,
  },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Cash on Delivery',
  CARD: 'Card',
  UPI: 'UPI / Wallet',
};

/** The happy path, in order. CANCELLED and REFUNDED are terminal side states. */
export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const ORDER_STATUSES: readonly OrderStatus[] = [...ORDER_STATUS_FLOW, 'CANCELLED', 'REFUNDED'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const PAYMENT_STATUSES: readonly PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const SHIPPING_CARRIERS: readonly string[] = ['FedEx', 'UPS', 'USPS', 'DHL', 'BlueDart', 'Delhivery'];

/** Index in ORDER_STATUS_FLOW, or -1 for CANCELLED / REFUNDED. */
export function orderStatusStep(status: OrderStatus): number {
  return ORDER_STATUS_FLOW.indexOf(status);
}

/** Orders still moving through fulfilment (not delivered, cancelled or refunded). */
export function isOrderOpen(order: Pick<Order, 'status'>): boolean {
  const step = orderStatusStep(order.status);
  return step >= 0 && order.status !== 'DELIVERED';
}

/** Cancellation is allowed until the order ships. */
export function canCancelOrder(order: Pick<Order, 'status'>): boolean {
  const step = orderStatusStep(order.status);
  return step >= 0 && step < orderStatusStep('SHIPPED');
}

/** Refunds apply to CANCELLED or DELIVERED orders whose payment was captured. */
export function canRefundOrder(order: Pick<Order, 'status' | 'paymentStatus'>): boolean {
  return (order.status === 'CANCELLED' || order.status === 'DELIVERED') && order.paymentStatus === 'PAID';
}

/** Tracking can be set once the order exists and until it is delivered / cancelled. */
export function canSetTracking(order: Pick<Order, 'status'>): boolean {
  return isOrderOpen(order);
}

/** Statuses the order may move to right now: any LATER step of the flow, plus CANCELLED / REFUNDED when allowed. */
export function nextStatuses(order: Pick<Order, 'status' | 'paymentStatus'>): OrderStatus[] {
  const step = orderStatusStep(order.status);
  const next: OrderStatus[] = step >= 0 ? ORDER_STATUS_FLOW.slice(step + 1) : [];
  if (canCancelOrder(order)) next.push('CANCELLED');
  if (canRefundOrder(order)) next.push('REFUNDED');
  return next;
}

export function canTransition(order: Pick<Order, 'status' | 'paymentStatus'>, to: OrderStatus): boolean {
  return nextStatuses(order).includes(to);
}

const EMPTY_ORDERS: Order[] = [];

function isOrderLike(value: unknown): value is Order {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.orderNumber === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.status === 'string' &&
    typeof value.paymentStatus === 'string' &&
    typeof value.paymentMethod === 'string' &&
    Array.isArray(value.items) &&
    isRecord(value.address) &&
    isRecord(value.totals) &&
    typeof value.createdAt === 'string'
  );
}

const isKnownStatus = (value: unknown): value is OrderStatus =>
  typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);

function isStatusEvent(value: unknown): value is OrderStatusEvent {
  return isRecord(value) && isKnownStatus(value.status) && typeof value.at === 'string';
}

const textOrNull = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value : null);

/** Lazy migration of Milestone 2 orders: fills the Milestone 3 fields without rewriting storage. */
function normalizeOrder(order: Order): Order {
  const status: OrderStatus = isKnownStatus(order.status) ? order.status : 'PLACED';
  const paymentStatus: PaymentStatus = (PAYMENT_STATUSES as readonly string[]).includes(order.paymentStatus)
    ? order.paymentStatus
    : 'PENDING';
  const stored = Array.isArray(order.statusHistory) ? order.statusHistory.filter(isStatusEvent) : [];
  const statusHistory: OrderStatusEvent[] = stored.length > 0 ? stored : [{ status, at: order.createdAt }];
  return {
    ...order,
    status,
    paymentStatus,
    statusHistory,
    updatedAt: typeof order.updatedAt === 'string' ? order.updatedAt : statusHistory[statusHistory.length - 1].at,
    trackingNumber: textOrNull(order.trackingNumber),
    trackingCarrier: textOrNull(order.trackingCarrier),
    paymentId: textOrNull(order.paymentId),
    cancelReason: textOrNull(order.cancelReason),
    couponCode: textOrNull(order.couponCode),
  };
}

export function ordersStore(userId: string) {
  return getJsonStore(storageKeys.orders(userId), EMPTY_ORDERS, (v) => sanitizeArray(v, isOrderLike).map(normalizeOrder));
}

/** One customer's orders, newest first. */
export function getOrders(userId: string): readonly Order[] {
  return ordersStore(userId).get();
}

const normalizeOrderNumber = (orderNumber: string) => orderNumber.trim().toUpperCase();

/** Customer-scoped lookup (only searches `userId`'s orders). */
export function getUserOrderByNumber(userId: string, orderNumber: string | null | undefined): Order | undefined {
  if (!orderNumber) return undefined;
  const wanted = normalizeOrderNumber(orderNumber);
  return getOrders(userId).find((order) => order.orderNumber === wanted);
}

export function hasPurchasedProduct(userId: string, productId: string): boolean {
  return getOrders(userId).some(
    (order) =>
      order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && order.items.some((item) => item.productId === productId),
  );
}

const EMPTY_ADMIN_ORDERS: readonly AdminOrder[] = [];
let allOrdersCache: { users: StoredUser[]; lists: (readonly Order[])[]; snapshot: readonly AdminOrder[] } | null = null;

/**
 * Every order across all users, newest first, each joined with its customer.
 * Referentially stable until users or any orders key changes: safe as a useSyncExternalStore snapshot.
 */
export function listAllOrders(): readonly AdminOrder[] {
  const users = usersStore().get();
  const lists = users.map((user) => getOrders(user.id));
  if (
    allOrdersCache &&
    allOrdersCache.users === users &&
    allOrdersCache.lists.length === lists.length &&
    allOrdersCache.lists.every((list, index) => list === lists[index])
  ) {
    return allOrdersCache.snapshot;
  }
  const all: AdminOrder[] = [];
  users.forEach((user, index) => {
    const customer = { id: user.id, name: user.name, email: user.email };
    lists[index].forEach((order) => all.push({ ...order, customer }));
  });
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  const snapshot = all.length > 0 ? all : EMPTY_ADMIN_ORDERS;
  allOrdersCache = { users, lists, snapshot };
  return snapshot;
}

export function getServerAllOrders(): readonly AdminOrder[] {
  return EMPTY_ADMIN_ORDERS;
}

export function subscribeAllOrders(callback: () => void): () => void {
  const unsubOrders = subscribePrefix(storageKeys.ordersPrefix, callback);
  const unsubUsers = subscribeKey(storageKeys.users, callback);
  return () => {
    unsubOrders();
    unsubUsers();
  };
}

/** Admin lookup across all users. */
export function getOrderByNumber(orderNumber: string | null | undefined): AdminOrder | undefined {
  if (!orderNumber) return undefined;
  const wanted = normalizeOrderNumber(orderNumber);
  return listAllOrders().find((order) => order.orderNumber === wanted);
}

export function generateOrderNumber(existing: readonly Pick<Order, 'orderNumber'>[] = listAllOrders()): string {
  const taken = new Set(existing.map((o) => o.orderNumber));
  let candidate = `${ORDER_NUMBER_PREFIX}${randomBase36(8)}`;
  while (taken.has(candidate)) candidate = `${ORDER_NUMBER_PREFIX}${randomBase36(8)}`;
  return candidate;
}

function saveOrder(order: Order): void {
  ordersStore(order.userId).update((orders) => orders.map((o) => (o.id === order.id ? order : o)));
}

function stripCustomer(order: AdminOrder | Order): Order {
  if (!('customer' in order)) return order;
  const copy: Partial<AdminOrder> = { ...order };
  delete copy.customer;
  return copy as Order;
}

function withStatus(order: Order, status: OrderStatus, note?: string, at: string = new Date().toISOString()): Order {
  const event: OrderStatusEvent = note?.trim() ? { status, at, note: note.trim().slice(0, 300) } : { status, at };
  return { ...order, status, statusHistory: [...order.statusHistory, event], updatedAt: at };
}

/** Bulk insert for demo seeding: one write per user, newest first. */
export function importOrders(orders: readonly Order[]): void {
  const byUser = new Map<string, Order[]>();
  orders.forEach((order) => byUser.set(order.userId, [...(byUser.get(order.userId) ?? []), order]));
  byUser.forEach((list, userId) => {
    const merged = [...list, ...getOrders(userId)].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );
    ordersStore(userId).set(merged);
  });
}

export interface PlaceOrderInput {
  addressId: string;
  paymentMethod: PaymentMethod;
}

interface OrderDraft {
  address: Address;
  lines: CartLine[];
  items: OrderItem[];
  totals: Order['totals'];
  coupon: Coupon | null;
}

/** Re-validates cart, stock, address and coupon from storage + the effective catalog (never trusts UI totals). */
function prepareOrder(userId: string, addressId: string): ServiceResult<OrderDraft> {
  const cartItems = getCartItems(userId);
  if (cartItems.length === 0) return { ok: false, error: 'Your cart is empty' };

  const address = getAddress(userId, addressId);
  if (!address) return { ok: false, error: 'Please select a shipping address' };
  if (hasErrors(validateAddressInput(addressToInput(address)))) {
    return { ok: false, error: 'Your shipping address is incomplete. Please edit it and try again.' };
  }

  const lines = buildCartLines(cartItems);
  if (lines.length !== cartItems.length) {
    return { ok: false, error: 'Some items in your cart are no longer available. Please review your cart.' };
  }
  for (const line of lines) {
    const label = line.variantLabel ? `${line.name} (${line.variantLabel})` : line.name;
    if (line.availableStock <= 0) return { ok: false, error: `${label} is out of stock. Please remove it from your cart.` };
    if (line.quantity > line.availableStock) {
      return { ok: false, error: `Only ${line.availableStock} left of ${label}. Please update the quantity.` };
    }
  }

  const couponCode = getCartCouponCode(userId);
  const subtotal = calculateTotals(lines).subtotal;
  const validation = couponCode ? validateCoupon(couponCode, subtotal) : null;
  if (couponCode && validation && !validation.ok) {
    setCartCouponCode(userId, null);
    return { ok: false, error: `Coupon ${couponCode} was removed: ${validation.error}` };
  }
  const coupon = validation?.ok ? validation.coupon : null;
  const totals = calculateTotals(lines, coupon);

  return {
    ok: true,
    data: {
      address,
      lines,
      coupon,
      items: lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        slug: line.slug,
        sku: line.sku,
        name: line.name,
        image: line.image,
        variantLabel: line.variantLabel,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
      totals: {
        itemCount: totals.itemCount,
        subtotal: totals.subtotal,
        discount: totals.discount,
        discountedSubtotal: totals.discountedSubtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total,
      },
    },
  };
}

interface CommitInput {
  userId: string;
  orderNumber: string;
  draft: OrderDraft;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId: string;
}

/** Stores the order, decrements stock, counts the coupon use and clears the bag. */
function commitOrder({ userId, orderNumber, draft, paymentMethod, paymentStatus, paymentId }: CommitInput): Order {
  const now = new Date().toISOString();
  const paid = paymentStatus === 'PAID';
  const statusHistory: OrderStatusEvent[] = [{ status: 'PLACED', at: now }];
  if (paid) statusHistory.push({ status: 'CONFIRMED', at: now, note: 'Payment received' });

  const order: Order = {
    id: randomId('ord'),
    orderNumber,
    userId,
    status: paid ? 'CONFIRMED' : 'PLACED',
    paymentStatus,
    paymentMethod,
    items: draft.items,
    address: toAddressSnapshot(draft.address),
    totals: draft.totals,
    couponCode: draft.coupon?.code ?? null,
    createdAt: now,
    updatedAt: now,
    statusHistory,
    trackingNumber: null,
    trackingCarrier: null,
    paymentId,
    cancelReason: null,
  };

  adjustStock(draft.items, 'decrement');
  recordCouponUse(order.couponCode);
  ordersStore(userId).set([order, ...getOrders(userId)]);
  clearCart(userId);
  return order;
}

/**
 * Cash on Delivery checkout (Milestone 2 signature). Online methods must go through
 * `payAndPlaceOrder`, which collects the payment first.
 */
export async function placeOrder(userId: string, input: PlaceOrderInput): Promise<ServiceResult<Order>> {
  if (input.paymentMethod !== 'COD') {
    return { ok: false, error: 'Enter your payment details to pay online.' };
  }
  await new Promise<void>((resolve) => setTimeout(resolve, PLACE_ORDER_LATENCY_MS));

  const draft = prepareOrder(userId, input.addressId);
  if (!draft.ok) return draft;

  const orderNumber = generateOrderNumber();
  const payment = createPaymentForOrder({
    orderNumber,
    userId,
    method: 'COD',
    amount: draft.data.totals.total,
    status: 'PENDING',
    gateway: COD_GATEWAY_ID,
  });
  const order = commitOrder({
    userId,
    orderNumber,
    draft: draft.data,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    paymentId: payment.id,
  });
  return { ok: true, data: order };
}

export type CheckoutPaymentInput =
  | { addressId: string; paymentMethod: 'COD' }
  | { addressId: string; paymentMethod: 'CARD'; card: CardDetails }
  | { addressId: string; paymentMethod: 'UPI'; upiId: string };

export type CheckoutErrorCode = 'VALIDATION' | 'ORDER_INVALID' | 'PAYMENT_FAILED' | 'PAYMENT_CANCELLED';

export type CheckoutResult =
  | { ok: true; data: Order }
  | { ok: false; error: string; code: CheckoutErrorCode; fieldErrors?: FieldErrors<PaymentField> };

export interface PayAndPlaceOrderOptions {
  /** Abort to cancel the payment while it is in flight (result code PAYMENT_CANCELLED, bag untouched). */
  signal?: AbortSignal;
  /** Progress callback for the UI ("Contacting gateway…" -> "Confirming payment…" -> "Placing order…"). */
  onStage?(stage: 'initiating' | 'confirming' | 'placing', intent: PaymentIntent | null): void;
}

export function validatePaymentInput(input: CheckoutPaymentInput): FieldErrors<PaymentField> {
  if (input.paymentMethod === 'CARD') return validateCardDetails(input.card);
  if (input.paymentMethod === 'UPI') {
    const error = validateUpiId(input.upiId);
    return error ? { upiId: error } : {};
  }
  return {};
}

const PAYMENT_CANCELLED_ERROR = 'Payment was cancelled. Your bag is unchanged.';

/**
 * Checkout entry point for every payment method: validate -> initiate -> confirm -> create order.
 *  - COD: order PLACED, payment PENDING.
 *  - CARD / UPI success: order CONFIRMED, payment PAID.
 *  - Failure / cancellation: NO order is created and the bag is left intact; a FAILED / CANCELLED
 *    payment record is kept for the admin payments view.
 */
export async function payAndPlaceOrder(
  userId: string,
  input: CheckoutPaymentInput,
  options: PayAndPlaceOrderOptions = {},
): Promise<CheckoutResult> {
  const fieldErrors = validatePaymentInput(input);
  if (hasErrors(fieldErrors)) {
    return { ok: false, error: 'Please check your payment details', code: 'VALIDATION', fieldErrors };
  }

  if (input.paymentMethod === 'COD') {
    const result = await placeOrder(userId, input);
    return result.ok ? result : { ok: false, error: result.error, code: 'ORDER_INVALID' };
  }

  const draft = prepareOrder(userId, input.addressId);
  if (!draft.ok) return { ok: false, error: draft.error, code: 'ORDER_INVALID' };

  const { signal, onStage } = options;
  const gateway = activeGateway;
  const orderNumber = generateOrderNumber();
  const amount = draft.data.totals.total;
  const method: PaymentMethodDetails =
    input.paymentMethod === 'CARD' ? { type: 'CARD', card: input.card } : { type: 'UPI', upiId: input.upiId };

  const recordAttempt = (status: PaymentStatus, details: { reference?: string; cardBrand?: string; cardLast4?: string; upiId?: string; failureReason?: string }) =>
    createPaymentForOrder({ orderNumber, userId, method: input.paymentMethod, amount, status, gateway: gateway.id, ...details });

  try {
    onStage?.('initiating', null);
    const intent = await gateway.initiate({ amount, currency: 'USD', orderNumber, userId });

    const cancelled = async (): Promise<CheckoutResult> => {
      const result = await gateway.cancel(intent.id);
      recordAttempt('CANCELLED', { reference: result.reference, failureReason: result.failureReason });
      return { ok: false, error: PAYMENT_CANCELLED_ERROR, code: 'PAYMENT_CANCELLED' };
    };
    if (signal?.aborted) return await cancelled();

    onStage?.('confirming', intent);
    const aborted = new Promise<'aborted'>((resolve) => {
      signal?.addEventListener('abort', () => resolve('aborted'), { once: true });
    });
    const outcome = await Promise.race([gateway.confirm(intent.id, method), aborted]);
    if (outcome === 'aborted') return await cancelled();

    const details = {
      reference: outcome.reference,
      cardBrand: outcome.cardBrand,
      cardLast4: outcome.cardLast4,
      upiId: outcome.upiId,
    };
    if (outcome.status === 'CANCELLED') {
      recordAttempt('CANCELLED', { ...details, failureReason: outcome.failureReason });
      return { ok: false, error: PAYMENT_CANCELLED_ERROR, code: 'PAYMENT_CANCELLED' };
    }
    if (outcome.status === 'FAILED') {
      const reason = outcome.failureReason ?? 'Your payment could not be completed';
      recordAttempt('FAILED', { ...details, failureReason: reason });
      return { ok: false, error: `${reason}. You have not been charged and your bag is unchanged.`, code: 'PAYMENT_FAILED' };
    }

    onStage?.('placing', intent);
    // The bag or stock may have changed while the payment was in flight.
    const finalDraft = prepareOrder(userId, input.addressId);
    if (!finalDraft.ok || finalDraft.data.totals.total !== amount) {
      recordAttempt('REFUNDED', { ...details, failureReason: 'Order could not be created after payment; refunded automatically' });
      const why = finalDraft.ok ? 'Your bag changed while the payment was processing.' : finalDraft.error;
      return { ok: false, error: `${why} Your payment has been refunded.`, code: 'ORDER_INVALID' };
    }

    const payment = recordAttempt('PAID', details);
    const order = commitOrder({
      userId,
      orderNumber,
      draft: finalDraft.data,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'PAID',
      paymentId: payment.id,
    });
    return { ok: true, data: order };
  } catch {
    recordAttempt('FAILED', { failureReason: 'Payment gateway unavailable' });
    return { ok: false, error: 'We could not reach the payment gateway. Please try again.', code: 'PAYMENT_FAILED' };
  }
}

function paymentOf(order: Order) {
  return getPaymentById(order.paymentId) ?? getPaymentByOrder(order.orderNumber);
}

function syncPayment(order: Order, status: PaymentStatus): Order {
  let payment = paymentOf(order);
  // Milestone 2 orders have no payment record: create one on first touch.
  if (!payment) {
    payment = createPaymentForOrder({
      orderNumber: order.orderNumber,
      userId: order.userId,
      method: order.paymentMethod,
      amount: order.totals.total,
      status,
      gateway: order.paymentMethod === 'COD' ? COD_GATEWAY_ID : activeGateway.id,
    });
  } else if (payment.status !== status) {
    setPaymentStatus(payment.id, status);
  }
  return { ...order, paymentStatus: status, paymentId: payment.id };
}

export interface CancelOrderOptions {
  /** Pass the signed-in customer's id for customer-initiated cancellations: the order must be theirs. */
  byUserId?: string;
}

/**
 * Cancels an order that has not shipped and restores its stock. Unpaid (COD) payments become
 * CANCELLED; a PAID order stays PAID until an admin calls `refundOrder`.
 */
export function cancelOrder(orderNumber: string, reason?: string, options: CancelOrderOptions = {}): ServiceResult<Order> {
  const found = getOrderByNumber(orderNumber);
  if (!found || (options.byUserId && found.userId !== options.byUserId)) return { ok: false, error: 'Order not found' };
  if (found.status === 'CANCELLED') return { ok: false, error: 'This order is already cancelled' };
  if (!canCancelOrder(found)) {
    return { ok: false, error: `This order can no longer be cancelled (${ORDER_STATUS_LABELS[found.status]}).` };
  }
  const cleanReason = reason?.trim().slice(0, 300) || null;
  const note = options.byUserId
    ? cleanReason
      ? `Cancelled by customer: ${cleanReason}`
      : 'Cancelled by customer'
    : (cleanReason ?? 'Cancelled by store');
  let order = withStatus(stripCustomer(found), 'CANCELLED', note);
  order = { ...order, cancelReason: cleanReason };
  if (order.paymentStatus === 'PENDING') order = syncPayment(order, 'CANCELLED');
  saveOrder(order);
  adjustStock(order.items, 'increment');
  return { ok: true, data: order };
}

/** Marks the payment REFUNDED and the order REFUNDED. Only for CANCELLED / DELIVERED orders that were PAID. */
export function refundOrder(orderNumber: string, note?: string): ServiceResult<Order> {
  const found = getOrderByNumber(orderNumber);
  if (!found) return { ok: false, error: 'Order not found' };
  if (found.status === 'REFUNDED') return { ok: false, error: 'This order is already refunded' };
  if (!canRefundOrder(found)) {
    return {
      ok: false,
      error:
        found.paymentStatus !== 'PAID'
          ? 'Only paid orders can be refunded'
          : 'Only cancelled or delivered orders can be refunded',
    };
  }
  const order = syncPayment(withStatus(stripCustomer(found), 'REFUNDED', note ?? 'Payment refunded'), 'REFUNDED');
  saveOrder(order);
  return { ok: true, data: order };
}

/**
 * Admin status update with transition checks. CANCELLED / REFUNDED delegate to cancelOrder / refundOrder.
 * Moving a Cash-on-Delivery order to DELIVERED also collects the cash (payment PENDING -> PAID).
 */
export function updateOrderStatus(orderNumber: string, status: OrderStatus, note?: string): ServiceResult<Order> {
  const found = getOrderByNumber(orderNumber);
  if (!found) return { ok: false, error: 'Order not found' };
  if (!isKnownStatus(status)) return { ok: false, error: 'Select a valid status' };
  if (found.status === status) return { ok: false, error: `This order is already ${ORDER_STATUS_LABELS[status]}` };
  if (status === 'CANCELLED') return cancelOrder(orderNumber, note);
  if (status === 'REFUNDED') return refundOrder(orderNumber, note);
  if (!canTransition(found, status)) {
    return {
      ok: false,
      error: `An order that is ${ORDER_STATUS_LABELS[found.status]} cannot move to ${ORDER_STATUS_LABELS[status]}`,
    };
  }
  let order = withStatus(stripCustomer(found), status, note);
  if (status === 'DELIVERED' && order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING') {
    order = syncPayment(order, 'PAID');
  }
  saveOrder(order);
  return { ok: true, data: order };
}

export type TrackingField = 'carrier' | 'trackingNumber';

/** Saves carrier + tracking number. Does not change the status (use updateOrderStatus(…, 'SHIPPED')). */
export function setTracking(orderNumber: string, carrier: string, trackingNumber: string): ServiceResult<Order> {
  const found = getOrderByNumber(orderNumber);
  if (!found) return { ok: false, error: 'Order not found' };
  if (!canSetTracking(found)) {
    return { ok: false, error: `Tracking cannot be changed once an order is ${ORDER_STATUS_LABELS[found.status]}` };
  }
  const fieldErrors: FieldErrors<TrackingField> = {};
  const cleanCarrier = carrier.trim();
  const cleanNumber = trackingNumber.trim().toUpperCase();
  if (!cleanCarrier) fieldErrors.carrier = 'Carrier is required';
  else if (cleanCarrier.length > 40) fieldErrors.carrier = 'Carrier must be 40 characters or fewer';
  if (!cleanNumber) fieldErrors.trackingNumber = 'Tracking number is required';
  else if (!/^[A-Z0-9-]{6,40}$/.test(cleanNumber)) fieldErrors.trackingNumber = 'Use 6-40 letters, numbers or dashes';
  if (hasErrors(fieldErrors)) return { ok: false, error: 'Please fix the highlighted fields', fieldErrors };

  const order: Order = {
    ...stripCustomer(found),
    trackingCarrier: cleanCarrier,
    trackingNumber: cleanNumber,
    updatedAt: new Date().toISOString(),
  };
  saveOrder(order);
  return { ok: true, data: order };
}

/** Admin: cash collected for a COD order (payment PENDING -> PAID). */
export function markCodCollected(orderNumber: string): ServiceResult<Order> {
  const found = getOrderByNumber(orderNumber);
  if (!found) return { ok: false, error: 'Order not found' };
  if (found.paymentMethod !== 'COD') return { ok: false, error: 'This order was not placed with Cash on Delivery' };
  if (found.paymentStatus !== 'PENDING') {
    return { ok: false, error: `Payment is already ${PAYMENT_STATUS_LABELS[found.paymentStatus]}` };
  }
  if (found.status === 'CANCELLED' || found.status === 'REFUNDED') {
    return { ok: false, error: 'Cash cannot be collected for a cancelled order' };
  }
  const order = syncPayment({ ...stripCustomer(found), updatedAt: new Date().toISOString() }, 'PAID');
  saveOrder(order);
  return { ok: true, data: order };
}

/** Alias kept for the payments vocabulary of the PRD: refunds the payment of an order. */
export const refundPayment = refundOrder;
