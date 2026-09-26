// Dashboard analytics: PURE functions over an AnalyticsSource (orders + customers + catalog), plus the
// demo seeder. Every function takes an optional `source` so React can pass live data
// (see hooks/useAnalytics); when omitted the current storage state is read.
//
// REVENUE DEFINITION used everywhere: sum of `order.totals.total` over orders whose status is not
// CANCELLED or REFUNDED (so COD orders count from the moment they are placed).

import type { CategoryRecord, ProductRecord } from '../mockTypes';
import { calculateTotals, roundMoney } from '../pricing';
import { clearAllStorage } from '../storage';
import { normalizeEmail } from '../validation';
import { addressesStore, toAddressSnapshot } from './addresses';
import { ensureAdminSeeded, importUsers } from './auth';
import { getCatalog, LOW_STOCK_THRESHOLD, productStockLevel, publishedProductsOf, totalStock } from './catalogStore';
import { recordCouponUse, validateCoupon } from './coupons';
import { randomBase36, randomHex, randomId, sha256HexSync } from './crypto';
import { countsAsSale, listCustomers } from './customers';
import {
  importOrders,
  isOrderOpen,
  listAllOrders,
  ORDER_NUMBER_PREFIX,
  ORDER_STATUS_FLOW,
  orderStatusStep,
} from './orders';
import { COD_GATEWAY_ID, importPayments } from './payments';
import type {
  Address,
  AdminOrder,
  CustomerSummary,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusEvent,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  StoredUser,
} from './types';

export interface AnalyticsSource {
  orders: readonly AdminOrder[];
  customers: readonly CustomerSummary[];
  /** Effective catalog, drafts included. */
  products: readonly ProductRecord[];
  categories: readonly CategoryRecord[];
}

/** Reads the current storage state. */
export function collectAnalyticsSource(): AnalyticsSource {
  const catalog = getCatalog();
  return {
    orders: listAllOrders(),
    customers: listCustomers(),
    products: catalog.products,
    categories: catalog.categories,
  };
}

export interface DashboardStats {
  /** Sum of order totals excluding CANCELLED / REFUNDED orders. */
  totalSales: number;
  /** All orders, any status. */
  orderCount: number;
  /** Registered customers (admins excluded). */
  customerCount: number;
  /** Products in the effective catalog, drafts included. */
  productCount: number;
  publishedProductCount: number;
  /** Open orders: PLACED, CONFIRMED, PROCESSING, SHIPPED or OUT_FOR_DELIVERY. */
  pendingOrders: number;
  /** DELIVERED orders. */
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  /** In stock but low: total <= 5 or any active variant <= 5 (out-of-stock products are NOT included). */
  lowStock: ProductRecord[];
  outOfStock: ProductRecord[];
  outOfStockCount: number;
  /** Newest 5. */
  recentOrders: AdminOrder[];
  /** Newest 5 registrations. */
  recentCustomers: CustomerSummary[];
  /** totalSales / number of orders that count as a sale (0 when none). */
  averageOrderValue: number;
}

export function getDashboardStats(source: AnalyticsSource = collectAnalyticsSource()): DashboardStats {
  const sales = source.orders.filter(countsAsSale);
  const totalSales = roundMoney(sales.reduce((sum, order) => sum + order.totals.total, 0));
  const outOfStock = source.products.filter((p) => productStockLevel(p) === 'out_of_stock');
  const lowStock = source.products
    .filter((p) => productStockLevel(p) === 'low_stock')
    .sort((a, b) => totalStock(a) - totalStock(b));
  return {
    totalSales,
    orderCount: source.orders.length,
    customerCount: source.customers.length,
    productCount: source.products.length,
    publishedProductCount: source.products.filter((p) => p.status !== 'draft').length,
    pendingOrders: source.orders.filter(isOrderOpen).length,
    completedOrders: source.orders.filter((o) => o.status === 'DELIVERED').length,
    cancelledOrders: source.orders.filter((o) => o.status === 'CANCELLED').length,
    refundedOrders: source.orders.filter((o) => o.status === 'REFUNDED').length,
    lowStock,
    outOfStock,
    outOfStockCount: outOfStock.length,
    recentOrders: source.orders.slice(0, 5),
    recentCustomers: source.customers.slice(0, 5),
    averageOrderValue: sales.length > 0 ? roundMoney(totalSales / sales.length) : 0,
  };
}

/** Local calendar day, "YYYY-MM-DD". */
export function dayKey(date: Date | string | number): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface DailySales {
  /** Local day, "YYYY-MM-DD". */
  date: string;
  revenue: number;
  /** Orders that count as a sale that day. */
  orders: number;
}

/** Last `days` local days ending today, oldest first, zero-filled. */
export function salesByDay(
  days = 14,
  source: AnalyticsSource = collectAnalyticsSource(),
  now: number = Date.now(),
): DailySales[] {
  const span = Math.max(1, Math.floor(days));
  const buckets = new Map<string, DailySales>();
  const today = new Date(now);
  for (let i = span - 1; i >= 0; i--) {
    const date = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
    buckets.set(date, { date, revenue: 0, orders: 0 });
  }
  source.orders.filter(countsAsSale).forEach((order) => {
    const bucket = buckets.get(dayKey(order.createdAt));
    if (!bucket) return;
    bucket.revenue = roundMoney(bucket.revenue + order.totals.total);
    bucket.orders += 1;
  });
  return [...buckets.values()];
}

export interface BestSeller {
  productId: string;
  name: string;
  image: string | null;
  units: number;
  /** Sum of line totals (before order-level discount, shipping and tax). */
  revenue: number;
}

export function bestSellers(limit = 5, source: AnalyticsSource = collectAnalyticsSource()): BestSeller[] {
  const byProduct = new Map<string, BestSeller>();
  source.orders.filter(countsAsSale).forEach((order) => {
    order.items.forEach((item) => {
      const current = byProduct.get(item.productId);
      if (current) {
        current.units += item.quantity;
        current.revenue = roundMoney(current.revenue + item.lineTotal);
      } else {
        const product = source.products.find((p) => p.id === item.productId);
        byProduct.set(item.productId, {
          productId: item.productId,
          name: product?.name ?? item.name,
          image: product?.images[0]?.url ?? item.image,
          units: item.quantity,
          revenue: roundMoney(item.lineTotal),
        });
      }
    });
  });
  return [...byProduct.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, Math.max(0, Math.floor(limit)));
}

export interface CategorySales {
  categoryId: string | null;
  name: string;
  units: number;
  revenue: number;
  /** 0-100 share of the summed revenue. */
  percent: number;
}

/** Item revenue grouped by the product's CURRENT category, highest first. Deleted products fall under "Other". */
export function salesByCategory(source: AnalyticsSource = collectAnalyticsSource()): CategorySales[] {
  const productsById = new Map(source.products.map((p) => [p.id, p]));
  const rows = new Map<string, CategorySales>();
  source.orders.filter(countsAsSale).forEach((order) => {
    order.items.forEach((item) => {
      const product = productsById.get(item.productId);
      const key = product?.categoryId ?? 'other';
      const row = rows.get(key) ?? {
        categoryId: product?.categoryId ?? null,
        name: product?.categoryName ?? 'Other',
        units: 0,
        revenue: 0,
        percent: 0,
      };
      row.units += item.quantity;
      row.revenue = roundMoney(row.revenue + item.lineTotal);
      rows.set(key, row);
    });
  });
  const total = [...rows.values()].reduce((sum, row) => sum + row.revenue, 0);
  return [...rows.values()]
    .map((row) => ({ ...row, percent: total > 0 ? Math.round((row.revenue / total) * 100) : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface PaymentMethodShare {
  method: PaymentMethod;
  orders: number;
  revenue: number;
  /** 0-100 share of the counted orders. */
  percent: number;
}

/** Always returns COD, CARD, UPI (in that order) over orders that count as a sale. */
export function paymentMethodSplit(source: AnalyticsSource = collectAnalyticsSource()): PaymentMethodShare[] {
  const sales = source.orders.filter(countsAsSale);
  const methods: PaymentMethod[] = ['COD', 'CARD', 'UPI'];
  return methods.map((method) => {
    const matching = sales.filter((o) => o.paymentMethod === method);
    return {
      method,
      orders: matching.length,
      revenue: roundMoney(matching.reduce((sum, o) => sum + o.totals.total, 0)),
      percent: sales.length > 0 ? Math.round((matching.length / sales.length) * 100) : 0,
    };
  });
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
}

/** Every status (flow order, then CANCELLED, REFUNDED) with its order count. */
export function orderStatusSplit(source: AnalyticsSource = collectAnalyticsSource()): OrderStatusCount[] {
  const statuses: OrderStatus[] = [...ORDER_STATUS_FLOW, 'CANCELLED', 'REFUNDED'];
  return statuses.map((status) => ({ status, count: source.orders.filter((o) => o.status === status).length }));
}

export { LOW_STOCK_THRESHOLD };

// ---------------------------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------------------------

export const DEMO_CUSTOMER_PASSWORD = 'Demo@12345';

export const DEMO_CUSTOMERS: readonly { name: string; email: string; phone: string; city: string; state: string; postalCode: string; line1: string }[] = [
  { name: 'Maya Thompson', email: 'maya.demo@couture.test', phone: '+1 415 555 0134', line1: '2210 Fillmore Street', city: 'San Francisco', state: 'CA', postalCode: '94115' },
  { name: 'Daniel Okafor', email: 'daniel.demo@couture.test', phone: '+1 312 555 0187', line1: '845 W Fulton Market', city: 'Chicago', state: 'IL', postalCode: '60607' },
  { name: 'Priya Raman', email: 'priya.demo@couture.test', phone: '+1 512 555 0121', line1: '1600 S Congress Avenue', city: 'Austin', state: 'TX', postalCode: '78704' },
  { name: 'Lucas Meyer', email: 'lucas.demo@couture.test', phone: '+1 718 555 0166', line1: '77 Bedford Avenue', city: 'Brooklyn', state: 'NY', postalCode: '11211' },
];

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DemoOrderPlan {
  daysAgo: number;
  customer: number;
  status: OrderStatus;
  method: PaymentMethod;
  coupon: string | null;
}

const DEMO_ORDER_PLAN: readonly DemoOrderPlan[] = [
  { daysAgo: 13, customer: 0, status: 'DELIVERED', method: 'CARD', coupon: 'WELCOME10' },
  { daysAgo: 13, customer: 1, status: 'DELIVERED', method: 'COD', coupon: null },
  { daysAgo: 12, customer: 2, status: 'DELIVERED', method: 'UPI', coupon: null },
  { daysAgo: 11, customer: 3, status: 'REFUNDED', method: 'CARD', coupon: null },
  { daysAgo: 10, customer: 0, status: 'DELIVERED', method: 'UPI', coupon: 'FLAT5' },
  { daysAgo: 9, customer: 1, status: 'DELIVERED', method: 'CARD', coupon: null },
  { daysAgo: 9, customer: 2, status: 'CANCELLED', method: 'COD', coupon: null },
  { daysAgo: 8, customer: 3, status: 'DELIVERED', method: 'COD', coupon: 'WELCOME10' },
  { daysAgo: 7, customer: 0, status: 'DELIVERED', method: 'CARD', coupon: null },
  { daysAgo: 6, customer: 2, status: 'DELIVERED', method: 'UPI', coupon: null },
  { daysAgo: 5, customer: 1, status: 'OUT_FOR_DELIVERY', method: 'CARD', coupon: 'FLAT5' },
  { daysAgo: 5, customer: 3, status: 'CANCELLED', method: 'CARD', coupon: null },
  { daysAgo: 4, customer: 0, status: 'SHIPPED', method: 'COD', coupon: null },
  { daysAgo: 3, customer: 2, status: 'SHIPPED', method: 'UPI', coupon: 'WELCOME10' },
  { daysAgo: 2, customer: 1, status: 'PROCESSING', method: 'CARD', coupon: null },
  { daysAgo: 2, customer: 3, status: 'PROCESSING', method: 'COD', coupon: null },
  { daysAgo: 1, customer: 0, status: 'CONFIRMED', method: 'UPI', coupon: null },
  { daysAgo: 0, customer: 2, status: 'PLACED', method: 'COD', coupon: null },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function demoPaymentStatus(plan: DemoOrderPlan): PaymentStatus {
  if (plan.status === 'REFUNDED') return 'REFUNDED';
  if (plan.method !== 'COD') return 'PAID'; // a cancelled card order stays PAID so the refund action can be demoed
  if (plan.status === 'DELIVERED') return 'PAID';
  return plan.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING';
}

function demoHistory(plan: DemoOrderPlan, createdAt: number, now: number): OrderStatusEvent[] {
  const online = plan.method !== 'COD';
  let path: OrderStatus[];
  if (plan.status === 'REFUNDED') path = [...ORDER_STATUS_FLOW, 'REFUNDED'];
  else if (plan.status === 'CANCELLED') path = online ? ['PLACED', 'CONFIRMED', 'CANCELLED'] : ['PLACED', 'CANCELLED'];
  else path = ORDER_STATUS_FLOW.slice(0, orderStatusStep(plan.status) + 1);

  const gap = Math.min(9 * HOUR_MS, Math.max(60_000, (now - createdAt - 60_000) / path.length));
  return path.map((status, index) => {
    // Online orders are confirmed the moment they are paid.
    const paidConfirmation = status === 'CONFIRMED' && online;
    const at = new Date(Math.min(now - 1000, createdAt + (paidConfirmation ? 0 : index * gap))).toISOString();
    if (paidConfirmation) return { status, at, note: 'Payment received' };
    if (status === 'CANCELLED') {
      return { status, at, note: `Cancelled by customer: ${online ? 'Found a better price' : 'Ordered by mistake'}` };
    }
    if (status === 'REFUNDED') return { status, at, note: 'Item returned — payment refunded' };
    return { status, at };
  });
}

export interface SeedDemoResult {
  seeded: boolean;
  orders: number;
  customers: number;
}

/**
 * Only when there are ZERO orders in storage: creates 4 demo customers (password DEMO_CUSTOMER_PASSWORD)
 * and 18 historical orders over the last 14 days with mixed statuses, payment methods and coupons, plus
 * matching payment records and coupon usage counts. Historical orders do NOT change inventory.
 * Synchronous and idempotent; call it from the admin dashboard / login on mount.
 */
export function seedDemoActivity(now: number = Date.now()): SeedDemoResult {
  if (typeof window === 'undefined') return { seeded: false, orders: 0, customers: 0 };
  ensureAdminSeeded();
  if (listAllOrders().length > 0) return { seeded: false, orders: 0, customers: 0 };

  const rand = mulberry32(0xc07e5eed);
  const registeredBase = now - 21 * DAY_MS;
  const accounts: StoredUser[] = DEMO_CUSTOMERS.map((customer, index) => {
    const salt = randomHex(16);
    const createdAt = new Date(registeredBase + index * 1.5 * DAY_MS + Math.floor(rand() * 6) * HOUR_MS).toISOString();
    return {
      id: randomId('usr'),
      name: customer.name,
      email: normalizeEmail(customer.email),
      phone: customer.phone,
      role: 'customer',
      status: 'active',
      salt,
      passwordHash: sha256HexSync(`${salt}${DEMO_CUSTOMER_PASSWORD}`),
      createdAt,
      updatedAt: createdAt,
    };
  });
  const users = importUsers(accounts);
  const userByEmail = new Map(users.map((u) => [u.email, u]));

  const addresses = DEMO_CUSTOMERS.map((customer) => {
    const user = userByEmail.get(normalizeEmail(customer.email));
    if (!user) return null;
    const store = addressesStore(user.id);
    const existing = store.get()[0];
    if (existing) return existing;
    const address: Address = {
      id: randomId('adr'),
      fullName: customer.name,
      phone: customer.phone,
      line1: customer.line1,
      line2: '',
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      country: 'United States',
      isDefault: true,
      createdAt: user.createdAt,
      updatedAt: user.createdAt,
    };
    store.set([address]);
    return address;
  });

  const products = publishedProductsOf(getCatalog()).filter((p) => totalStock(p) > 0);
  if (products.length === 0) return { seeded: false, orders: 0, customers: users.length };

  const orders: Order[] = [];
  const payments: PaymentRecord[] = [];
  const couponUses = new Map<string, number>();
  const takenNumbers = new Set<string>();

  DEMO_ORDER_PLAN.forEach((plan, planIndex) => {
    const demo = DEMO_CUSTOMERS[plan.customer];
    const user = userByEmail.get(normalizeEmail(demo.email));
    const address = addresses[plan.customer];
    if (!user || !address) return;

    const createdMs =
      plan.daysAgo === 0
        ? now - (40 + Math.floor(rand() * 90)) * 60_000
        : now - plan.daysAgo * DAY_MS - Math.floor(rand() * 8 * HOUR_MS);
    const createdAt = new Date(createdMs).toISOString();

    const lineCount = 1 + Math.floor(rand() * 3);
    const items: OrderItem[] = [];
    for (let i = 0; i < lineCount; i++) {
      const product = products[Math.floor(rand() * products.length)];
      if (items.some((item) => item.productId === product.id)) continue;
      const variants = product.variants.filter((v) => v.isActive && v.stock > 0);
      const variant = variants.length > 0 ? variants[Math.floor(rand() * variants.length)] : null;
      if (product.variants.length > 0 && !variant) continue;
      const quantity = rand() < 0.75 ? 1 : 2;
      const unitPrice = roundMoney(product.price + (variant?.priceDelta ?? 0));
      const attributes = variant ? Object.entries(variant.attributes) : [];
      items.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        slug: product.slug,
        sku: variant?.sku ?? product.sku,
        name: product.name,
        image: product.images[0]?.url ?? null,
        variantLabel:
          attributes.length > 0
            ? attributes.map(([key, value]) => `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${value}`).join(' · ')
            : null,
        unitPrice,
        quantity,
        lineTotal: roundMoney(unitPrice * quantity),
      });
    }
    if (items.length === 0) return;

    const subtotal = calculateTotals(items).subtotal;
    const couponCheck = plan.coupon ? validateCoupon(plan.coupon, subtotal, createdMs) : null;
    const coupon = couponCheck?.ok ? couponCheck.coupon : null;
    const totals = calculateTotals(items, coupon);
    if (coupon) couponUses.set(coupon.code, (couponUses.get(coupon.code) ?? 0) + 1);

    let orderNumber = `${ORDER_NUMBER_PREFIX}${randomBase36(8)}`;
    while (takenNumbers.has(orderNumber)) orderNumber = `${ORDER_NUMBER_PREFIX}${randomBase36(8)}`;
    takenNumbers.add(orderNumber);

    const statusHistory = demoHistory(plan, createdMs, now);
    const updatedAt = statusHistory[statusHistory.length - 1].at;
    const paymentStatus = demoPaymentStatus(plan);
    const shipped = statusHistory.some((event) => event.status === 'SHIPPED');
    const paymentId = randomId('pay');
    const last4 = ['4242', '1881', '0005', '4444'][planIndex % 4];

    payments.push({
      id: paymentId,
      orderNumber,
      userId: user.id,
      method: plan.method,
      status: paymentStatus,
      amount: totals.total,
      currency: 'USD',
      gateway: plan.method === 'COD' ? COD_GATEWAY_ID : 'couture-pay-test',
      reference: plan.method === 'COD' ? `cod_${randomBase36(10)}` : `cp_test_${randomBase36(10)}`,
      ...(plan.method === 'CARD' ? { cardBrand: last4 === '4444' ? 'Mastercard' : 'Visa', cardLast4: last4 } : {}),
      ...(plan.method === 'UPI' ? { upiId: `${demo.name.slice(0, 2).toLowerCase()}•••••@upi` } : {}),
      createdAt,
      updatedAt,
    });

    orders.push({
      id: randomId('ord'),
      orderNumber,
      userId: user.id,
      status: plan.status,
      paymentStatus,
      paymentMethod: plan.method,
      items,
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
      couponCode: coupon?.code ?? null,
      createdAt,
      updatedAt,
      statusHistory,
      trackingCarrier: shipped ? ['FedEx', 'UPS', 'DHL'][planIndex % 3] : null,
      trackingNumber: shipped ? `TRK${randomBase36(10)}` : null,
      paymentId,
      cancelReason:
        plan.status === 'CANCELLED' ? (plan.method === 'COD' ? 'Ordered by mistake' : 'Found a better price') : null,
    });
  });

  importOrders(orders);
  importPayments(payments);
  couponUses.forEach((times, code) => recordCouponUse(code, times));
  return { seeded: orders.length > 0, orders: orders.length, customers: users.length };
}

/**
 * Clears EVERY `couture:v1:` key: users (the admin is re-seeded on the next sign-in), session (you are
 * signed out), carts, wishlists, addresses, orders, payments, coupons, reviews and catalog overrides.
 */
export function resetDemoData(): void {
  clearAllStorage();
}
