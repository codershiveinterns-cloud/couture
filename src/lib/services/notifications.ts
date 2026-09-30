// Transactional notifications (PRD 5.7): registration, order confirmation, payment, status updates,
// shipping and delivery. There is no email backend yet, so every event is recorded twice in the
// `notifications` key:
//   - one 'in_app' record  -> the header bell + /account/notifications (read / unread)
//   - one 'email' record   -> the OUTBOX: subject + plain-text body rendered here, waiting for a transport
//
// The outbox pattern: the store is the source of truth, a transport drains it. Today the transport is
// `consoleTransport` (logs the message and marks it delivered). To send real email, implement
// `EmailTransport` server-side with SendGrid / Resend / SES and call `setEmailTransport(...)`:
//
//   const resendTransport: EmailTransport = {
//     id: 'resend',
//     async send(email) {
//       await fetch('/api/email', { method: 'POST', body: JSON.stringify(email) }); // server route holds RESEND_API_KEY
//     },
//   };
//   setEmailTransport(resendTransport);
//
// `notify()` never throws and never changes the ServiceResult of the caller: a broken transport only
// leaves `deliveredAt` null, which the admin outbox shows as "Queued".

import { getJsonStore, isRecord, sanitizeArray, storageKeys, subscribeKey } from '../storage';
import { formatPrice } from '../format';
import { randomId } from './crypto';
import type {
  NotificationChannel,
  NotificationRecord,
  NotificationType,
  Order,
  OrderStatus,
  PaymentMethod,
} from './types';

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'REGISTRATION',
  'ORDER_CONFIRMATION',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'ORDER_STATUS',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'ORDER_REFUNDED',
];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  REGISTRATION: 'Welcome',
  ORDER_CONFIRMATION: 'Order confirmation',
  PAYMENT_RECEIVED: 'Payment received',
  PAYMENT_FAILED: 'Payment failed',
  ORDER_STATUS: 'Status update',
  ORDER_SHIPPED: 'Shipped',
  ORDER_DELIVERED: 'Delivered',
  ORDER_CANCELLED: 'Cancelled',
  ORDER_REFUNDED: 'Refunded',
};

/** Keeps localStorage bounded: oldest records are dropped beyond this. */
const MAX_RECORDS = 600;
const STORE_NAME = 'Couture';
const SUPPORT_EMAIL = 'support@couture.test';

// ---------------------------------------------------------------------------------------------
// Email transport

export interface OutboundEmail {
  /** The 'email' notification record id. */
  id: string;
  to: string;
  subject: string;
  /** Plain-text body (line breaks with \n). */
  text: string;
  type: NotificationType;
  orderNumber: string | null;
}

/**
 * Anything that can deliver one rendered email. Resolve when the provider accepted the message;
 * reject (or throw) to leave it queued in the outbox.
 */
export interface EmailTransport {
  readonly id: string;
  send(email: OutboundEmail): Promise<void>;
}

/** Development transport: prints the message to the browser console and reports success. */
export const consoleTransport: EmailTransport = {
  id: 'console',
  async send(email) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[email:${email.type}] to ${email.to} — ${email.subject}\n${email.text}`);
    }
  },
};

let activeTransport: EmailTransport = consoleTransport;

export function setEmailTransport(transport: EmailTransport): void {
  activeTransport = transport;
}

export function getEmailTransport(): EmailTransport {
  return activeTransport;
}

// ---------------------------------------------------------------------------------------------
// Store

const EMPTY: NotificationRecord[] = [];
const TYPES: readonly string[] = NOTIFICATION_TYPES;
const CHANNELS: readonly string[] = ['in_app', 'email'];

function isNotificationRecord(value: unknown): value is NotificationRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.type === 'string' &&
    TYPES.includes(value.type) &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    typeof value.href === 'string' &&
    (value.orderNumber === null || typeof value.orderNumber === 'string') &&
    typeof value.channel === 'string' &&
    CHANNELS.includes(value.channel) &&
    typeof value.emailTo === 'string' &&
    typeof value.subject === 'string' &&
    typeof value.read === 'boolean' &&
    typeof value.createdAt === 'string' &&
    (value.deliveredAt === null || typeof value.deliveredAt === 'string')
  );
}

export function notificationsStore() {
  return getJsonStore(storageKeys.notifications, EMPTY, (v) => sanitizeArray(v, isNotificationRecord));
}

/** Every record (both channels), newest first. */
export function listNotifications(): readonly NotificationRecord[] {
  return notificationsStore().get();
}

export function subscribeNotifications(callback: () => void): () => void {
  return subscribeKey(storageKeys.notifications, callback);
}

export function getServerNotifications(): readonly NotificationRecord[] {
  return EMPTY;
}

const userCache = new Map<string, { all: readonly NotificationRecord[]; list: readonly NotificationRecord[] }>();

/** In-app notifications of one user, newest first. Referentially stable until the store changes. */
export function listForUser(userId: string): readonly NotificationRecord[] {
  const all = listNotifications();
  const cached = userCache.get(userId);
  if (cached && cached.all === all) return cached.list;
  const filtered = all.filter((n) => n.channel === 'in_app' && n.userId === userId);
  const list = filtered.length > 0 ? filtered : EMPTY;
  userCache.set(userId, { all, list });
  return list;
}

export function unreadCount(userId: string): number {
  return listForUser(userId).reduce((count, n) => (n.read ? count : count + 1), 0);
}

let outboxCache: { all: readonly NotificationRecord[]; list: readonly NotificationRecord[] } | null = null;

/** Admin: every rendered email, newest first (stable snapshot). */
export function listOutbox(): readonly NotificationRecord[] {
  const all = listNotifications();
  if (outboxCache && outboxCache.all === all) return outboxCache.list;
  const filtered = all.filter((n) => n.channel === 'email');
  const list = filtered.length > 0 ? filtered : EMPTY;
  outboxCache = { all, list };
  return list;
}

export function markRead(id: string): void {
  const all = listNotifications();
  if (!all.some((n) => n.id === id && !n.read)) return;
  notificationsStore().set(all.map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function markAllRead(userId: string): void {
  const all = listNotifications();
  if (!all.some((n) => n.userId === userId && n.channel === 'in_app' && !n.read)) return;
  notificationsStore().set(all.map((n) => (n.userId === userId && n.channel === 'in_app' && !n.read ? { ...n, read: true } : n)));
}

function markDelivered(id: string): void {
  const all = listNotifications();
  if (!all.some((n) => n.id === id)) return;
  const at = new Date().toISOString();
  notificationsStore().set(all.map((n) => (n.id === id ? { ...n, deliveredAt: at } : n)));
}

/** Demo reset helper. */
export function clearNotifications(): void {
  notificationsStore().clear();
}

// ---------------------------------------------------------------------------------------------
// Events -> copy

export interface Recipient {
  id: string;
  name: string;
  email: string;
}

export type NotificationEvent =
  | { type: 'REGISTRATION'; user: Recipient }
  | {
      type:
        | 'ORDER_CONFIRMATION'
        | 'PAYMENT_RECEIVED'
        | 'ORDER_STATUS'
        | 'ORDER_SHIPPED'
        | 'ORDER_DELIVERED'
        | 'ORDER_CANCELLED'
        | 'ORDER_REFUNDED';
      user: Recipient;
      order: Order;
    }
  | {
      type: 'PAYMENT_FAILED';
      user: Recipient;
      orderNumber: string;
      amount: number;
      method: PaymentMethod;
      reason: string;
    };

interface RenderedNotification {
  title: string;
  body: string;
  subject: string;
  emailBody: string;
  href: string;
  orderNumber: string | null;
}

const STATUS_SENTENCE: Record<OrderStatus, string> = {
  PLACED: 'has been placed',
  CONFIRMED: 'is confirmed',
  PROCESSING: 'is being prepared',
  SHIPPED: 'is on its way',
  OUT_FOR_DELIVERY: 'is out for delivery',
  DELIVERED: 'has been delivered',
  CANCELLED: 'has been cancelled',
  REFUNDED: 'has been refunded',
};

const METHOD_LABEL: Record<PaymentMethod, string> = { COD: 'cash on delivery', CARD: 'card', UPI: 'UPI' };

const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';
const orderHref = (orderNumber: string) => `/account/orders/${orderNumber}`;

function itemSummary(order: Order): string {
  const lines = order.items.map((item) => {
    const label = item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name;
    return `  • ${item.quantity} × ${label} — ${formatPrice(item.lineTotal)}`;
  });
  return lines.join('\n');
}

function shipTo(order: Order): string {
  const a = order.address;
  return [a.fullName, a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`, a.country].filter(Boolean).join(', ');
}

function wrapEmail(user: Recipient, paragraphs: string[]): string {
  return [`Hi ${firstName(user.name)},`, '', ...paragraphs, '', `— The ${STORE_NAME} team`, `Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`].join('\n');
}

export function renderNotification(event: NotificationEvent): RenderedNotification {
  const { user } = event;

  if (event.type === 'REGISTRATION') {
    return {
      title: `Welcome to ${STORE_NAME}, ${firstName(user.name)}!`,
      body: 'Your account is ready. Save addresses, track orders and keep a wishlist — all in one place.',
      subject: `Welcome to ${STORE_NAME}`,
      emailBody: wrapEmail(user, [
        `Thanks for creating your ${STORE_NAME} account (${user.email}).`,
        'From your account you can save shipping addresses, follow every order from placement to delivery, and keep a wishlist of things you love.',
        'Use WELCOME10 at checkout for 10% off your first order over $30.',
      ]),
      href: '/account',
      orderNumber: null,
    };
  }

  if (event.type === 'PAYMENT_FAILED') {
    const amount = formatPrice(event.amount);
    return {
      title: 'Your payment did not go through',
      body: `${event.reason}. The ${amount} ${METHOD_LABEL[event.method]} payment was not taken and your bag is unchanged.`,
      subject: `Payment of ${amount} could not be completed`,
      emailBody: wrapEmail(user, [
        `We could not complete your ${METHOD_LABEL[event.method]} payment of ${amount} (attempt ${event.orderNumber}).`,
        `Reason: ${event.reason}.`,
        'You have not been charged and no order was created. Your bag is exactly as you left it, so you can return to checkout and try again or choose a different payment method.',
      ]),
      href: '/checkout',
      orderNumber: event.orderNumber,
    };
  }

  const { order } = event;
  const n = order.orderNumber;
  const total = formatPrice(order.totals.total);
  const href = orderHref(n);
  const count = `${order.totals.itemCount} ${order.totals.itemCount === 1 ? 'item' : 'items'}`;
  const tracking =
    order.trackingCarrier && order.trackingNumber ? `${order.trackingCarrier} tracking ${order.trackingNumber}` : null;

  switch (event.type) {
    case 'ORDER_CONFIRMATION': {
      const cod = order.paymentMethod === 'COD';
      return {
        title: `Order ${n} placed`,
        body: cod
          ? `Thanks for your order of ${count} (${total}). Pay ${total} in cash when it arrives.`
          : `Thanks for your order of ${count} (${total}). We'll let you know as soon as it ships.`,
        subject: `Your ${STORE_NAME} order ${n} is confirmed`,
        emailBody: wrapEmail(user, [
          `Thanks for shopping with ${STORE_NAME}. We've received order ${n} and will email you again when it ships.`,
          `Items (${count}):\n${itemSummary(order)}`,
          `Order total: ${total}${order.totals.discount > 0 ? ` (includes ${formatPrice(order.totals.discount)} off${order.couponCode ? ` with ${order.couponCode}` : ''})` : ''}`,
          `Payment: ${cod ? `Cash on delivery — please keep ${total} ready when the courier arrives.` : `Paid by ${METHOD_LABEL[order.paymentMethod]}.`}`,
          `Shipping to: ${shipTo(order)}`,
          `Track it any time: ${href}`,
        ]),
        href,
        orderNumber: n,
      };
    }
    case 'PAYMENT_RECEIVED':
      return {
        title: `Payment of ${total} received`,
        body: `We've received your ${METHOD_LABEL[order.paymentMethod]} payment for order ${n}.`,
        subject: `Payment received for order ${n}`,
        emailBody: wrapEmail(user, [
          `This is your receipt: we've received ${total} by ${METHOD_LABEL[order.paymentMethod]} for order ${n}.`,
          `Items (${count}):\n${itemSummary(order)}`,
          `Keep this email for your records. You can also see the payment details at ${href}.`,
        ]),
        href,
        orderNumber: n,
      };
    case 'ORDER_SHIPPED':
      return {
        title: `Order ${n} is on its way`,
        body: tracking ? `Shipped via ${tracking}. Expected in 3–5 business days.` : 'Your parcel has left our warehouse. Expected in 3–5 business days.',
        subject: `Your ${STORE_NAME} order ${n} is on its way${tracking ? ` — ${tracking}` : ''}`,
        emailBody: wrapEmail(user, [
          `Good news: order ${n} (${count}) has shipped and should reach you in 3–5 business days.`,
          tracking ? `Carrier: ${order.trackingCarrier}\nTracking number: ${order.trackingNumber}` : 'We will send the tracking number as soon as the carrier confirms it.',
          `Delivering to: ${shipTo(order)}`,
          `Follow the delivery at ${href}`,
        ]),
        href,
        orderNumber: n,
      };
    case 'ORDER_DELIVERED':
      return {
        title: `Order ${n} delivered`,
        body: `Your ${count} arrived. We hope you love ${order.totals.itemCount === 1 ? 'it' : 'them'} — a review helps other shoppers.`,
        subject: `Your ${STORE_NAME} order ${n} has been delivered`,
        emailBody: wrapEmail(user, [
          `Order ${n} was delivered to ${order.address.fullName} at ${order.address.line1}, ${order.address.city}.`,
          `Items (${count}):\n${itemSummary(order)}`,
          order.paymentMethod === 'COD' ? `Thanks for paying ${total} on delivery.` : 'Nothing more to pay — this order was settled online.',
          `Not quite right? You have 30 days for easy returns. Manage the order at ${href}`,
        ]),
        href,
        orderNumber: n,
      };
    case 'ORDER_CANCELLED': {
      const paid = order.paymentStatus === 'PAID';
      return {
        title: `Order ${n} cancelled`,
        body: paid ? `Your order was cancelled. The ${total} you paid will be refunded to the original payment method.` : 'Your order was cancelled. You have not been charged.',
        subject: `Your ${STORE_NAME} order ${n} has been cancelled`,
        emailBody: wrapEmail(user, [
          `Order ${n} (${count}, ${total}) has been cancelled${order.cancelReason ? ` — reason: ${order.cancelReason}` : ''}.`,
          paid ? `The ${total} you paid will be refunded to your original payment method; we'll email you when that goes through.` : 'You have not been charged for this order.',
          `The items are back in stock if you'd like to order again: ${href}`,
        ]),
        href,
        orderNumber: n,
      };
    }
    case 'ORDER_REFUNDED':
      return {
        title: `${total} refunded for order ${n}`,
        body: `We've refunded ${total} to your original payment method. It can take 5–7 business days to appear.`,
        subject: `Refund of ${total} issued for order ${n}`,
        emailBody: wrapEmail(user, [
          `We've issued a refund of ${total} for order ${n} to the ${METHOD_LABEL[order.paymentMethod]} you paid with.`,
          'Depending on your bank it can take 5–7 business days to show on your statement.',
          `Order details: ${href}`,
        ]),
        href,
        orderNumber: n,
      };
    case 'ORDER_STATUS':
    default: {
      const sentence = STATUS_SENTENCE[order.status] ?? 'was updated';
      const latest = order.statusHistory[order.statusHistory.length - 1];
      const note = latest?.status === order.status && latest.note ? latest.note : null;
      return {
        title: `Order ${n} ${sentence}`,
        body: note ?? `Your order of ${count} ${sentence}. We'll keep you posted at every step.`,
        subject: `Update on your ${STORE_NAME} order ${n}`,
        emailBody: wrapEmail(user, [
          `Order ${n} (${count}) ${sentence}.`,
          ...(note ? [`Note from the store: ${note}`] : []),
          `See the full timeline at ${href}`,
        ]),
        href,
        orderNumber: n,
      };
    }
  }
}

// ---------------------------------------------------------------------------------------------
// notify()

export interface NotifyResult {
  inApp: NotificationRecord;
  email: NotificationRecord;
}

function makeRecord(
  event: NotificationEvent,
  rendered: RenderedNotification,
  channel: NotificationChannel,
  createdAt: string,
): NotificationRecord {
  const email = channel === 'email';
  return {
    id: randomId(email ? 'eml' : 'ntf'),
    userId: event.user.id,
    type: event.type,
    title: rendered.title,
    body: email ? rendered.emailBody : rendered.body,
    href: rendered.href,
    orderNumber: rendered.orderNumber,
    channel,
    emailTo: event.user.email,
    subject: rendered.subject,
    read: email,
    createdAt,
    deliveredAt: null,
  };
}

/**
 * Records ONE in-app notification and ONE email outbox entry for the event, then hands the email
 * to the active transport. Never throws (a notification must never break the order/auth flow);
 * returns null when nothing could be recorded (e.g. on the server).
 */
export function notify(event: NotificationEvent): NotifyResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const rendered = renderNotification(event);
    const createdAt = new Date().toISOString();
    const inApp = makeRecord(event, rendered, 'in_app', createdAt);
    const email = makeRecord(event, rendered, 'email', createdAt);
    notificationsStore().set([inApp, email, ...listNotifications()].slice(0, MAX_RECORDS));

    const outbound: OutboundEmail = {
      id: email.id,
      to: email.emailTo,
      subject: email.subject,
      text: email.body,
      type: email.type,
      orderNumber: email.orderNumber,
    };
    void activeTransport
      .send(outbound)
      .then(() => markDelivered(email.id))
      .catch(() => {
        /* left queued in the outbox */
      });
    return { inApp, email };
  } catch {
    return null;
  }
}

/** Re-attempts delivery of every queued email (admin "Retry" action). Resolves with the number delivered. */
export async function drainOutbox(): Promise<number> {
  const queued = listOutbox().filter((n) => n.deliveredAt === null);
  let delivered = 0;
  for (const email of queued) {
    try {
      await activeTransport.send({
        id: email.id,
        to: email.emailTo,
        subject: email.subject,
        text: email.body,
        type: email.type,
        orderNumber: email.orderNumber,
      });
      markDelivered(email.id);
      delivered += 1;
    } catch {
      // stays queued
    }
  }
  return delivered;
}
