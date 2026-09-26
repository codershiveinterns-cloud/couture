// Payment RECORDS (localStorage key `payments`). One record per payment attempt.
// NEVER holds a full card number, expiry or CVC: only brand + last 4 (or a masked UPI id).
//
// This module is record-level only and does not know about orders. The order <-> payment flow
// (payAndPlaceOrder, markCodCollected, refundOrder, cancelOrder) lives in services/orders.ts, which
// keeps `order.paymentStatus` and the payment record in sync. UI code should call those.

import { roundMoney } from '../pricing';
import { getJsonStore, isRecord, sanitizeArray, storageKeys } from '../storage';
import { randomBase36, randomId } from './crypto';
import type { PaymentMethod, PaymentRecord, PaymentStatus } from './types';

export const COD_GATEWAY_ID = 'cod';

const EMPTY_PAYMENTS: PaymentRecord[] = [];
const METHODS: readonly string[] = ['COD', 'CARD', 'UPI'];
const STATUSES: readonly string[] = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'];

function isPaymentRecord(value: unknown): value is PaymentRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.orderNumber === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.method === 'string' &&
    METHODS.includes(value.method) &&
    typeof value.status === 'string' &&
    STATUSES.includes(value.status) &&
    typeof value.amount === 'number' &&
    typeof value.gateway === 'string' &&
    typeof value.reference === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

/** Whitelists the persisted fields so stray card data can never be written back. */
function toSafeRecord(record: PaymentRecord): PaymentRecord {
  const safe: PaymentRecord = {
    id: record.id,
    orderNumber: record.orderNumber,
    userId: record.userId,
    method: record.method,
    status: record.status,
    amount: record.amount,
    currency: 'USD',
    gateway: record.gateway,
    reference: record.reference,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  if (typeof record.cardBrand === 'string') safe.cardBrand = record.cardBrand.slice(0, 30);
  if (typeof record.cardLast4 === 'string' && /^\d{4}$/.test(record.cardLast4)) safe.cardLast4 = record.cardLast4;
  if (typeof record.upiId === 'string') safe.upiId = record.upiId.slice(0, 80);
  if (typeof record.failureReason === 'string') safe.failureReason = record.failureReason.slice(0, 200);
  return safe;
}

export function paymentsStore() {
  return getJsonStore(storageKeys.payments, EMPTY_PAYMENTS, (v) => sanitizeArray(v, isPaymentRecord).map(toSafeRecord));
}

/** Every payment attempt, newest first. Stable reference until the store changes. */
export function listPayments(): readonly PaymentRecord[] {
  return paymentsStore().get();
}

/**
 * The payment that belongs to an order: the successful/pending one when several attempts share the
 * number, otherwise the most recent attempt.
 */
export function getPaymentByOrder(orderNumber: string | null | undefined): PaymentRecord | undefined {
  if (!orderNumber) return undefined;
  const wanted = orderNumber.trim().toUpperCase();
  const matches = listPayments().filter((p) => p.orderNumber === wanted);
  return matches.find((p) => p.status !== 'FAILED' && p.status !== 'CANCELLED') ?? matches[0];
}

export function getPaymentById(paymentId: string | null | undefined): PaymentRecord | undefined {
  return paymentId ? listPayments().find((p) => p.id === paymentId) : undefined;
}

export function listPaymentsForUser(userId: string): PaymentRecord[] {
  return listPayments().filter((p) => p.userId === userId);
}

export interface CreatePaymentInput {
  orderNumber: string;
  userId: string;
  method: PaymentMethod;
  amount: number;
  /** COD defaults to PENDING. Online payments pass the gateway outcome. */
  status?: PaymentStatus;
  /** Defaults to "cod" for COD. */
  gateway?: string;
  reference?: string;
  cardBrand?: string;
  cardLast4?: string;
  /** Already masked (see payments/cards.maskUpiId). */
  upiId?: string;
  failureReason?: string;
  /** Historical seeding only. */
  createdAt?: string;
}

export function createPaymentForOrder(input: CreatePaymentInput): PaymentRecord {
  const now = input.createdAt ?? new Date().toISOString();
  const record = toSafeRecord({
    id: randomId('pay'),
    orderNumber: input.orderNumber.trim().toUpperCase(),
    userId: input.userId,
    method: input.method,
    status: input.status ?? 'PENDING',
    amount: roundMoney(input.amount),
    currency: 'USD',
    gateway: input.gateway ?? COD_GATEWAY_ID,
    reference: input.reference ?? `cod_${randomBase36(10)}`,
    cardBrand: input.cardBrand,
    cardLast4: input.cardLast4,
    upiId: input.upiId,
    failureReason: input.failureReason,
    createdAt: now,
    updatedAt: now,
  });
  paymentsStore().set([record, ...listPayments()]);
  return record;
}

/** Bulk insert for demo seeding (single write). */
export function importPayments(records: readonly PaymentRecord[]): void {
  if (records.length === 0) return;
  const merged = [...records.map(toSafeRecord), ...listPayments()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );
  paymentsStore().set(merged);
}

/** Record-level status change. Prefer the order-aware helpers in services/orders.ts. */
export function setPaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  failureReason?: string,
): PaymentRecord | undefined {
  const existing = getPaymentById(paymentId);
  if (!existing) return undefined;
  const updated = toSafeRecord({
    ...existing,
    status,
    failureReason: failureReason ?? existing.failureReason,
    updatedAt: new Date().toISOString(),
  });
  paymentsStore().set(listPayments().map((p) => (p.id === paymentId ? updated : p)));
  return updated;
}

/** "Visa •••• 4242", "UPI su•••@upi", "Cash on Delivery". */
export function describePaymentInstrument(payment: Pick<PaymentRecord, 'method' | 'cardBrand' | 'cardLast4' | 'upiId'>): string {
  if (payment.method === 'CARD') {
    return payment.cardLast4 ? `${payment.cardBrand ?? 'Card'} •••• ${payment.cardLast4}` : 'Card';
  }
  if (payment.method === 'UPI') return payment.upiId ? `UPI ${payment.upiId}` : 'UPI';
  return 'Cash on Delivery';
}
