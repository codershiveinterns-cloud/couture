'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PriceDetails } from '@/components/cart/PriceDetails';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useCart } from '@/context/CartContext';
import { useAddresses } from '@/hooks/useAddresses';
import { useOrders } from '@/hooks/useOrders';
import type { PaymentMethod } from '@/lib/services/types';
import { CheckoutHeader, type CheckoutStage } from './CheckoutHeader';
import { CheckoutStepper, type CheckoutStep } from './CheckoutStepper';
import { PaymentStep } from './PaymentStep';
import { ReviewStep } from './ReviewStep';
import { ShippingStep } from './ShippingStep';

interface CheckoutFlowProps {
  step: CheckoutStep;
  onStepChange(step: CheckoutStep): void;
}

function CheckoutFlow({ step, onStepChange }: CheckoutFlowProps) {
  const router = useRouter();
  const cart = useCart();
  const { addresses, defaultAddress, isReady: addressesReady } = useAddresses();
  const { placeOrder } = useOrders();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);

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

  if (cart.isEmpty) {
    return (
      <EmptyState
        title="Nothing to check out yet"
        description="Your bag is empty. Add a few products and come back to complete your order."
        action={<Button href="/products">Continue shopping</Button>}
      />
    );
  }

  const goTo = (next: CheckoutStep) => {
    setError(null);
    onStepChange(next);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a shipping address');
      onStepChange(0);
      return;
    }
    setPlacing(true);
    setError(null);
    const result = await placeOrder({ addressId: selectedAddress.id, paymentMethod });
    if (!result.ok) {
      setError(result.error);
      setPlacing(false);
      return;
    }
    setPlacedOrderNumber(result.data.orderNumber);
    router.push(`/checkout/success?order=${encodeURIComponent(result.data.orderNumber)}`);
  };

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
          {step === 1 && <PaymentStep value={paymentMethod} onChange={setPaymentMethod} onBack={() => goTo(0)} onNext={() => goTo(2)} />}
          {step === 2 && selectedAddress && (
            <ReviewStep
              address={selectedAddress}
              paymentMethod={paymentMethod}
              placing={placing}
              error={error}
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
