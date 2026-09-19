'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PAYMENT_METHODS } from '@/lib/services/orders';
import type { PaymentMethod } from '@/lib/services/types';
import { RadioCard } from './RadioCard';

export interface PaymentStepProps {
  value: PaymentMethod;
  onChange(method: PaymentMethod): void;
  onBack(): void;
  onNext(): void;
}

export function PaymentStep({ value, onChange, onBack, onNext }: PaymentStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-bold text-ink">Choose Payment Mode</h2>
        <p className="mt-1 text-[13px] text-ink-3">Secure demo checkout — no real payment is taken.</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Payment methods</legend>
        {PAYMENT_METHODS.map((method) => (
          <RadioCard
            key={method.id}
            id={`payment-${method.id}`}
            name="payment-method"
            value={method.id}
            checked={value === method.id}
            disabled={!method.available}
            onChange={(next) => onChange(next as PaymentMethod)}
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className={`text-[14px] font-bold ${method.available ? 'text-ink' : 'text-ink-3'}`}>{method.label}</span>
              {!method.available && (
                <Badge variant="neutral" size="sm">
                  Coming soon
                </Badge>
              )}
            </span>
            <span className={`mt-1 block text-[13px] ${method.available ? 'text-ink-2' : 'text-ink-4'}`}>{method.description}</span>
            {method.note && <span className="mt-1 block text-[12px] font-medium text-discount">{method.note}</span>}
          </RadioCard>
        ))}
      </fieldset>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack} className="px-0">
          Back
        </Button>
        <Button onClick={onNext} className="sm:min-w-[200px]">
          Continue
        </Button>
      </div>
    </div>
  );
}

export default PaymentStep;
