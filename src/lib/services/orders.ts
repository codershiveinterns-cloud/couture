import { validateCoupon } from '../coupons';
import { calculateTotals } from '../pricing';
import { getJsonStore, isRecord, sanitizeArray, storageKeys } from '../storage';
import { addressToInput, getAddress, toAddressSnapshot } from './addresses';
import { buildCartLines, clearCart, getCartCouponCode, getCartItems, setCartCouponCode } from './cart';
import { randomBase36, randomId } from './crypto';
import { validateAddressInput, hasErrors } from '../validation';
import type { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, ServiceResult } from './types';

export const ORDER_NUMBER_PREFIX = 'CTR-';
export const ONLINE_PAYMENTS_NOTE = 'Online payments launch in Milestone 3';
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
    available: false,
    note: ONLINE_PAYMENTS_NOTE,
  },
  {
    id: 'UPI',
    label: 'UPI / Wallet',
    description: 'UPI apps and digital wallets',
    available: false,
    note: ONLINE_PAYMENTS_NOTE,
  },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Cash on Delivery',
  CARD: 'Card',
  UPI: 'UPI / Wallet',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

const EMPTY_ORDERS: Order[] = [];

function isOrder(value: unknown): value is Order {
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

export function ordersStore(userId: string) {
  return getJsonStore(storageKeys.orders(userId), EMPTY_ORDERS, (v) => sanitizeArray(v, isOrder));
}

/** Newest first. */
export function getOrders(userId: string): readonly Order[] {
  return ordersStore(userId).get();
}

export function getOrderByNumber(userId: string, orderNumber: string | null | undefined): Order | undefined {
  if (!orderNumber) return undefined;
  const wanted = orderNumber.trim().toUpperCase();
  return getOrders(userId).find((order) => order.orderNumber === wanted);
}

export function generateOrderNumber(existing: readonly Order[] = []): string {
  const taken = new Set(existing.map((o) => o.orderNumber));
  let candidate = `${ORDER_NUMBER_PREFIX}${randomBase36(8)}`;
  while (taken.has(candidate)) candidate = `${ORDER_NUMBER_PREFIX}${randomBase36(8)}`;
  return candidate;
}

export function hasPurchasedProduct(userId: string, productId: string): boolean {
  return getOrders(userId).some((order) => order.items.some((item) => item.productId === productId));
}

export interface PlaceOrderInput {
  addressId: string;
  paymentMethod: PaymentMethod;
}

/**
 * Re-validates cart, stock, address, payment method and coupon from storage + catalog (never trusts UI totals),
 * stores the order, then clears the user's cart and coupon.
 */
export async function placeOrder(userId: string, input: PlaceOrderInput): Promise<ServiceResult<Order>> {
  await new Promise<void>((resolve) => setTimeout(resolve, PLACE_ORDER_LATENCY_MS));

  const items = getCartItems(userId);
  if (items.length === 0) return { ok: false, error: 'Your cart is empty' };

  if (input.paymentMethod !== 'COD') return { ok: false, error: ONLINE_PAYMENTS_NOTE };

  const address = getAddress(userId, input.addressId);
  if (!address) return { ok: false, error: 'Please select a shipping address' };
  if (hasErrors(validateAddressInput(addressToInput(address)))) {
    return { ok: false, error: 'Your shipping address is incomplete. Please edit it and try again.' };
  }

  const lines = buildCartLines(items);
  if (lines.length !== items.length) {
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
  const coupon = couponCode ? validateCoupon(couponCode, subtotal) : null;
  if (couponCode && coupon && !coupon.ok) {
    setCartCouponCode(userId, null);
    return { ok: false, error: `Coupon ${couponCode} was removed: ${coupon.error}` };
  }

  const totals = calculateTotals(lines, coupon?.ok ? coupon.coupon : null);
  const orderItems: OrderItem[] = lines.map((line) => ({
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
  }));

  const existing = getOrders(userId);
  const order: Order = {
    id: randomId('ord'),
    orderNumber: generateOrderNumber(existing),
    userId,
    status: 'PLACED',
    paymentStatus: 'PENDING',
    paymentMethod: 'COD',
    items: orderItems,
    address: toAddressSnapshot(address),
    totals: {
      itemCount: totals.itemCount,
      subtotal: totals.subtotal,
      discount: totals.discount,
      discountedSubtotal: totals.discountedSubtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
    },
    couponCode: coupon?.ok ? coupon.coupon.code : null,
    createdAt: new Date().toISOString(),
  };

  ordersStore(userId).set([order, ...existing]);
  clearCart(userId);
  return { ok: true, data: order };
}
