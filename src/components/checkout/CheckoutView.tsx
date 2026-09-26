'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PriceDetails } from '@/components/cart/PriceDetails';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useCart } from '@/context/CartContext';
import { useAddresses } from '@/hooks/useAddresses';
import { useOrders } from '@/hooks/useOrders';
import { cardDigits, detectCardBrand, EMPTY_CARD, maskUpiId, type CardDetails, type PaymentField } from '@/lib/payments/cards';
import { validatePaymentInput, type CheckoutPaymentInput } from '@/lib/services/orders';
import type { PaymentMethod } from '@/lib/services/types';
import type { FieldErrors } from '@/lib/validation';
import { CheckoutHeader, type CheckoutStage } from './CheckoutHeader';
import { CheckoutStepper, type CheckoutStep } from './CheckoutStepper';
import { PaymentProcessing, type PaymentStage } from './PaymentProcessing';
import { PaymentStep } from './PaymentStep';
import { ReviewStep, type CheckoutNotice } from './ReviewStep';
import { ShippingStep } from './ShippingStep';

interface CheckoutFlowProps {
  step: CheckoutStep;
  onStepChange(step: CheckoutStep): void;
}

function CheckoutFlow({ step, onStepChange }: CheckoutFlowProps) {
  const router = useRouter();
  const cart = useCart();
  const { addresses, defaultAddress, isReady: addressesReady } = useAddresses();
  const { placeOrder, payAndPlaceOrder } = useOrders();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  // Card / UPI details: component state only. Never written to storage, wiped after payment and on unmount.
  const [card, setCard] = useState<CardDetails>(EMPTY_CARD);
  const [upiId, setUpiId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<PaymentField>>({});
  const [placing, setPlacing] = useState(false);
  const [payStage, setPayStage] = useState<PaymentStage | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [payAmount, setPayAmount] = useState(0); // frozen at pay time: the bag empties just before the result arrives
  const [notice, setNotice] = useState<CheckoutNotice | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Leaving checkout mid-payment cancels it (the gateway cancel path), so nothing is charged in the background.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    [],
  );

  // Derive instead of syncing state so the default address is picked without an effect.
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress;

  if (!cart.isHydrated || !addressesReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-ink-4">
        <Spinner size="lg" label="Loading checkout" />
      </div>
    );
  }

  if (placedOrderNumber) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-3">
        <Spinner size="lg" label="Order placed, redirecting" />
        <p className="text-[14px]">Order placed — taking you to your confirmation…</p>
      </div>
    );
  }

  // The bag is emptied a tick before the order result arrives: don't flash the empty state mid-placement.
  if (cart.isEmpty && !payStage && !placing) {
    return (
      <EmptyState
        title="Nothing to check out yet"
        description="Your bag is empty. Add a few products and come back to complete your order."
        action={<Button href="/products">Continue shopping</Button>}
      />
    );
  }

  const goTo = (next: CheckoutStep) => {
    setNotice(null);
    onStepChange(next);
  };

  const paymentInput = (addressId: string): CheckoutPaymentInput =>
    paymentMethod === 'CARD'
      ? { addressId, paymentMethod: 'CARD', card }
      : paymentMethod === 'UPI'
        ? { addressId, paymentMethod: 'UPI', upiId }
        : { addressId, paymentMethod: 'COD' };

  const paymentInstrument =
    paymentMethod === 'CARD'
      ? `${detectCardBrand(card.number)} •••• ${cardDigits(card.number).slice(-4)}`
      : paymentMethod === 'UPI'
        ? `UPI ${maskUpiId(upiId)}`
        : null;

  const changeMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setFieldErrors({});
  };

  const continueFromPayment = () => {
    const errors = validatePaymentInput(paymentInput(selectedAddress?.id ?? ''));
    setFieldErrors(errors);
    if (Object.keys(errors).length === 0) goTo(2);
  };

  const clearPaymentDetails = () => {
    setCard(EMPTY_CARD);
    setUpiId('');
    setFieldErrors({});
  };

  const finish = (orderNumber: string) => {
    clearPaymentDetails();
    setPlacedOrderNumber(orderNumber);
    router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setNotice({ tone: 'error', title: 'Shipping address needed', message: 'Please select a shipping address', retryable: false });
      onStepChange(0);
      return;
    }
    setNotice(null);

    if (paymentMethod === 'COD') {
      setPlacing(true);
      const result = await placeOrder({ addressId: selectedAddress.id, paymentMethod });
      if (!result.ok) {
        setNotice({ tone: 'error', title: 'We couldn’t place your order', message: result.error, retryable: false });
        setPlacing(false);
        return;
      }
      finish(result.data.orderNumber);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setCancelling(false);
    setPayAmount(cart.totals.total);
    setPayStage('initiating');
    const result = await payAndPlaceOrder(paymentInput(selectedAddress.id), {
      signal: controller.signal,
      onStage: (stage) => setPayStage(stage),
    });
    if (abortRef.current !== controller) return; // unmounted or superseded
    abortRef.current = null;
    setPayStage(null);
    setCancelling(false);

    if (result.ok) {
      finish(result.data.orderNumber);
      return;
    }
    if (result.code === 'VALIDATION') {
      setFieldErrors(result.fieldErrors ?? {});
      onStepChange(1);
      return;
    }
    if (result.code === 'PAYMENT_CANCELLED') {
      setNotice({
        tone: 'neutral',
        title: 'Payment cancelled — you have not been charged',
        message: 'Your bag is unchanged. You can try again or choose another payment method.',
        retryable: true,
      });
      return;
    }
    if (result.code === 'PAYMENT_FAILED') {
      setNotice({
        tone: 'error',
        title: 'Payment failed',
        message: result.error, // already says the shopper was not charged and the bag is unchanged
        retryable: true,
      });
      return;
    }
    setNotice({ tone: 'error', title: 'We couldn’t place your order', message: result.error, retryable: false });
  };

  const cancelPayment = () => {
    setCancelling(true);
    abortRef.current?.abort();
  };

  if (payStage) {
    return (
      <div className="rounded-sm border border-line bg-white">
        <PaymentProcessing
          stage={payStage}
          amount={payAmount}
          instrument={paymentInstrument ?? ''}
          cancelling={cancelling}
          onCancel={cancelPayment}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="rounded-sm border border-line bg-white p-4 sm:p-6">
        <CheckoutStepper current={step} onSelect={goTo} />
        <div key={step} className="mt-6 animate-fade-in">
          {step === 0 && (
            <ShippingStep
              addresses={addresses}
              selectedId={selectedAddress?.id ?? null}
              onSelect={setSelectedAddressId}
              onNext={() => goTo(1)}
            />
          )}
          {step === 1 && (
            <PaymentStep
              value={paymentMethod}
              onChange={changeMethod}
              card={card}
              onCardChange={setCard}
              upiId={upiId}
              onUpiChange={setUpiId}
              fieldErrors={fieldErrors}
              onBack={() => goTo(0)}
              onNext={continueFromPayment}
            />
          )}
          {step === 2 && selectedAddress && (
            <ReviewStep
              address={selectedAddress}
              paymentMethod={paymentMethod}
              paymentInstrument={paymentInstrument}
              placing={placing}
              notice={notice}
              onRetry={handlePlaceOrder}
              onEditStep={goTo}
              onBack={() => goTo(1)}
              onPlaceOrder={handlePlaceOrder}
            />
          )}
          {step === 2 && !selectedAddress && (
            <div className="flex flex-col gap-4">
              <p role="alert" className="text-[13px] font-medium text-brand">
                Please choose a shipping address first.
              </p>
              <Button variant="secondary" onClick={() => goTo(0)} className="self-start">
                Choose address
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <PriceDetails
          footer={
            <p className="text-center text-[12px] text-ink-3">
              {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your bag ·{' '}
              <Link href="/cart" className="font-bold uppercase tracking-wide text-brand hover:underline">
                Edit bag
              </Link>
            </p>
          }
        />
      </div>
    </div>
  );
}

const STAGE_FOR_STEP: Record<CheckoutStep, CheckoutStage> = { 0: 'address', 1: 'payment', 2: 'payment' };

export function CheckoutView() {
  const [step, setStep] = useState<CheckoutStep>(0);

  return (
    <div className="bg-canvas">
      <CheckoutHeader stage={STAGE_FOR_STEP[step]} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 animate-fade-in">
        <RequireAuth>
          <CheckoutFlow step={step} onStepChange={setStep} />
        </RequireAuth>
      </div>
    </div>
  );
}

export default CheckoutView;
