// Payment gateway abstraction.
//
// HOW A REAL PROVIDER PLUGS IN (Razorpay / Stripe) — nothing below needs to change shape:
//
//   1. `initiate` becomes a call to OUR server (e.g. POST /api/payments/intents). The route handler
//      re-computes the order amount from the cart, then creates the provider object with the SECRET
//      key read from env vars that never reach the browser:
//        Stripe:    stripe.paymentIntents.create({ amount, currency })      STRIPE_SECRET_KEY
//        Razorpay:  razorpay.orders.create({ amount, currency, receipt })   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
//      It returns { id, clientSecret } -> mapped onto PaymentIntent.
//   2. `confirm` hands the intent to the provider's hosted UI (Stripe Elements confirmPayment /
//      Razorpay Checkout) using only the PUBLISHABLE key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY /
//      NEXT_PUBLIC_RAZORPAY_KEY_ID). Card data goes from the provider's iframe straight to the
//      provider: our code never sees the PAN, expiry or CVC. The result is then VERIFIED server-side
//      (Stripe webhook `payment_intent.succeeded` with STRIPE_WEBHOOK_SECRET, or Razorpay's
//      HMAC signature check) before the order is marked PAID.
//   3. `cancel` maps to paymentIntents.cancel / closing the Razorpay modal.
//   4. Refunds (services/orders.refundOrder) call stripe.refunds.create / razorpay.payments.refund
//      from a server route.
//
// No real SDKs or keys are included. The built-in `testGateway` simulates the same lifecycle in the
// browser with well-known test inputs. Card details exist only in memory for the duration of
// `confirm`; the result exposes brand + last 4 digits (or a masked UPI id) and nothing else.

import { randomBase36, randomId } from '../services/crypto';
import { cardDigits, detectCardBrand, maskUpiId, normalizeUpiId, type CardDetails } from './cards';

export type PaymentIntentStatus = 'REQUIRES_CONFIRMATION' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export interface InitiatePaymentInput {
  /** Order total in major units (dollars). */
  amount: number;
  currency: 'USD';
  orderNumber: string;
  userId: string;
}

export interface PaymentIntent {
  id: string;
  gateway: string;
  orderNumber: string;
  amount: number;
  currency: 'USD';
  status: PaymentIntentStatus;
  createdAt: string;
}

export type PaymentMethodDetails = { type: 'CARD'; card: CardDetails } | { type: 'UPI'; upiId: string };

export type PaymentFailureCode = 'card_declined' | 'insufficient_funds' | 'upi_declined' | 'intent_not_found' | 'cancelled';

export interface PaymentResult {
  intentId: string;
  status: Exclude<PaymentIntentStatus, 'REQUIRES_CONFIRMATION'>;
  /** Gateway transaction reference, e.g. "cp_test_8F3K2L9QWZ". */
  reference: string;
  failureCode?: PaymentFailureCode;
  failureReason?: string;
  cardBrand?: string;
  cardLast4?: string;
  /** Masked. */
  upiId?: string;
}

export interface PaymentGateway {
  id: string;
  label: string;
  initiate(input: InitiatePaymentInput): Promise<PaymentIntent>;
  confirm(intentId: string, method: PaymentMethodDetails): Promise<PaymentResult>;
  /** Customer backed out. Resolves with status CANCELLED; a later/in-flight confirm also resolves CANCELLED. */
  cancel(intentId: string): Promise<PaymentResult>;
}

export const TEST_CARDS = {
  success: '4242 4242 4242 4242',
  declined: '4000 0000 0000 0002',
  insufficientFunds: '4000 0000 0000 9995',
} as const;

export const TEST_UPI = {
  success: 'success@upi',
  failure: 'fail@upi',
} as const;

export const TEST_PAYMENT_HINTS: readonly { label: string; value: string; outcome: string }[] = [
  { label: 'Card', value: TEST_CARDS.success, outcome: 'Payment succeeds' },
  { label: 'Card', value: TEST_CARDS.declined, outcome: 'Card declined' },
  { label: 'Card', value: TEST_CARDS.insufficientFunds, outcome: 'Insufficient funds' },
  { label: 'UPI', value: TEST_UPI.success, outcome: 'Payment succeeds' },
  { label: 'UPI', value: TEST_UPI.failure, outcome: 'Payment fails' },
];

const MIN_LATENCY_MS = 600;
const MAX_LATENCY_MS = 900;
const simulateLatency = () =>
  new Promise<void>((resolve) => setTimeout(resolve, MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS)));

// In-memory only: intents never reach localStorage.
const intents = new Map<string, PaymentIntent>();

const newReference = () => `cp_test_${randomBase36(10)}`;

function settle(intent: PaymentIntent, status: PaymentResult['status']): void {
  intents.set(intent.id, { ...intent, status });
}

export const testGateway: PaymentGateway = {
  id: 'couture-pay-test',
  label: 'Couture Pay — test mode',

  async initiate(input) {
    await simulateLatency();
    const intent: PaymentIntent = {
      id: randomId('pi'),
      gateway: testGateway.id,
      orderNumber: input.orderNumber,
      amount: input.amount,
      currency: input.currency,
      status: 'REQUIRES_CONFIRMATION',
      createdAt: new Date().toISOString(),
    };
    intents.set(intent.id, intent);
    return intent;
  },

  async confirm(intentId, method) {
    await simulateLatency();
    const intent = intents.get(intentId);
    const reference = newReference();
    if (!intent) {
      return { intentId, status: 'FAILED', reference, failureCode: 'intent_not_found', failureReason: 'Payment session expired. Please try again.' };
    }
    if (intent.status === 'CANCELLED') {
      return { intentId, status: 'CANCELLED', reference, failureCode: 'cancelled', failureReason: 'Payment was cancelled' };
    }

    if (method.type === 'CARD') {
      const digits = cardDigits(method.card.number);
      const display = { cardBrand: detectCardBrand(digits), cardLast4: digits.slice(-4) };
      if (digits === cardDigits(TEST_CARDS.declined)) {
        settle(intent, 'FAILED');
        return { intentId, status: 'FAILED', reference, failureCode: 'card_declined', failureReason: 'Your card was declined', ...display };
      }
      if (digits === cardDigits(TEST_CARDS.insufficientFunds)) {
        settle(intent, 'FAILED');
        return { intentId, status: 'FAILED', reference, failureCode: 'insufficient_funds', failureReason: 'Your card has insufficient funds', ...display };
      }
      settle(intent, 'SUCCEEDED');
      return { intentId, status: 'SUCCEEDED', reference, ...display };
    }

    const upiId = maskUpiId(method.upiId);
    if (normalizeUpiId(method.upiId) === TEST_UPI.failure) {
      settle(intent, 'FAILED');
      return { intentId, status: 'FAILED', reference, failureCode: 'upi_declined', failureReason: 'The UPI payment was declined by your bank', upiId };
    }
    settle(intent, 'SUCCEEDED');
    return { intentId, status: 'SUCCEEDED', reference, upiId };
  },

  async cancel(intentId) {
    const intent = intents.get(intentId);
    if (intent && intent.status === 'REQUIRES_CONFIRMATION') settle(intent, 'CANCELLED');
    return { intentId, status: 'CANCELLED', reference: newReference(), failureCode: 'cancelled', failureReason: 'Payment was cancelled' };
  },
};

/** The gateway used by checkout. Swap this for a real provider adapter later. */
export const activeGateway: PaymentGateway = testGateway;
