'use client';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/format';

export type PaymentStage = 'initiating' | 'confirming' | 'placing';

const STAGES: readonly { key: PaymentStage; label: string }[] = [
  { key: 'initiating', label: 'Starting secure payment' },
  { key: 'confirming', label: 'Confirming with your bank' },
  { key: 'placing', label: 'Placing your order' },
];

export interface PaymentProcessingProps {
  stage: PaymentStage;
  amount: number;
  /** e.g. "Visa •••• 4242". */
  instrument: string;
  cancelling: boolean;
  onCancel(): void;
}

/** Full-panel "payment in progress" state shown while payAndPlaceOrder is running. */
export function PaymentProcessing({ stage, amount, instrument, cancelling, onCancel }: PaymentProcessingProps) {
  const activeIndex = STAGES.findIndex((s) => s.key === stage);
  // Once the gateway has confirmed and the order is being written there is nothing left to cancel.
  const canCancel = stage !== 'placing' && !cancelling;

  return (
    <div role="status" aria-live="polite" className="flex min-h-[420px] flex-col items-center justify-center px-4 py-10 text-center animate-fade-in">
      <span className="text-brand">
        <Spinner size="lg" label="Processing payment" />
      </span>
      <h2 className="mt-5 text-[18px] font-bold text-ink">{cancelling ? 'Cancelling payment…' : 'Contacting Couture Pay…'}</h2>
      <p className="mt-1.5 text-[14px] text-ink-2">
        Paying <span className="font-bold text-ink">{formatPrice(amount)}</span> with {instrument}
      </p>
      <p className="mt-1 text-[13px] font-bold text-discount">Please do not refresh or close this page.</p>

      <ol className="mt-6 flex w-full max-w-xs flex-col gap-2.5 text-left">
        {STAGES.map((s, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={s.key} className="flex items-center gap-2.5 text-[13px]">
              <span
                aria-hidden="true"
                className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                  done ? 'border-success bg-success text-white' : active ? 'border-brand' : 'border-line-strong'
                }`}
              >
                {done && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />}
              </span>
              <span className={done ? 'text-success' : active ? 'font-bold text-ink' : 'text-ink-3'}>{s.label}</span>
            </li>
          );
        })}
      </ol>

      <Button variant="secondary" size="sm" className="mt-7" onClick={onCancel} disabled={!canCancel}>
        {cancelling ? 'Cancelling…' : 'Cancel payment'}
      </Button>
      <p className="mt-3 text-[12px] text-ink-3">Test mode — no real money moves.</p>
    </div>
  );
}

export default PaymentProcessing;
