'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cardDigits, detectCardBrand, formatCardExpiry, formatCardNumber, type CardDetails, type PaymentField } from '@/lib/payments/cards';
import { TEST_PAYMENT_HINTS } from '@/lib/payments/gateway';
import { PAYMENT_METHODS } from '@/lib/services/orders';
import type { PaymentMethod } from '@/lib/services/types';
import type { FieldErrors } from '@/lib/validation';
import { RadioCard } from './RadioCard';

export interface PaymentStepProps {
  value: PaymentMethod;
  onChange(method: PaymentMethod): void;
  /** Card / UPI details live in the checkout's component state only: never persisted. */
  card: CardDetails;
  onCardChange(card: CardDetails): void;
  upiId: string;
  onUpiChange(upiId: string): void;
  fieldErrors: FieldErrors<PaymentField>;
  onBack(): void;
  onNext(): void;
}

const TEST_EXPIRY = '12/34';
const TEST_CVC = '123';
const TEST_NAME = 'Test Shopper';

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 018 0v3" strokeLinecap="round" />
    </svg>
  );
}

function TestModeBox({ method, onFill }: { method: 'CARD' | 'UPI'; onFill(value: string): void }) {
  const hints = TEST_PAYMENT_HINTS.filter((hint) => hint.label.toUpperCase() === method);
  if (hints.length === 0) return null;
  return (
    <aside aria-label="Test mode payment details" className="rounded-sm border border-dashed border-discount/60 bg-[#fff3e8] p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning" size="sm">
          Test mode
        </Badge>
        <p className="text-[12px] font-bold text-ink">No real money moves. Click a row to fill the form.</p>
      </div>
      <ul className="mt-2.5 flex flex-col gap-1.5">
        {hints.map((hint) => (
          <li key={hint.value}>
            <button
              type="button"
              onClick={() => onFill(hint.value)}
              aria-label={`Fill ${hint.value} — ${hint.outcome}`}
              className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-sm border border-line bg-white px-3 py-2 text-left transition-colors hover:border-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className="text-[13px] font-bold tabular-nums text-ink">{hint.value}</span>
              <span className="text-[12px] text-ink-3">{hint.outcome}</span>
            </button>
          </li>
        ))}
      </ul>
      {method === 'CARD' && (
        <p className="mt-2 text-[12px] text-ink-3">Use any future expiry (e.g. {TEST_EXPIRY}), any 3–4 digit CVC and any name.</p>
      )}
    </aside>
  );
}

export function PaymentStep({
  value,
  onChange,
  card,
  onCardChange,
  upiId,
  onUpiChange,
  fieldErrors,
  onBack,
  onNext,
}: PaymentStepProps) {
  const brand = detectCardBrand(card.number);
  const hasDigits = cardDigits(card.number).length > 0;

  const fillCard = (number: string) =>
    onCardChange({
      number: formatCardNumber(number),
      expiry: card.expiry || TEST_EXPIRY,
      cvc: card.cvc || TEST_CVC,
      name: card.name || TEST_NAME,
    });

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <div>
        <h2 className="text-[16px] font-bold text-ink">Choose Payment Mode</h2>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-3">
          <LockIcon /> Secure demo checkout powered by Couture Pay (test mode) — no real payment is taken.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Payment methods</legend>
        {PAYMENT_METHODS.map((method) => {
          const checked = value === method.id;
          return (
            <div key={method.id} className="flex flex-col">
              <RadioCard
                id={`payment-${method.id}`}
                name="payment-method"
                value={method.id}
                checked={checked}
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

              {checked && method.id === 'CARD' && (
                <div className="flex flex-col gap-4 rounded-b-sm border border-t-0 border-ink bg-surface/50 p-4 animate-fade-in">
                  <Input
                    label="Card number"
                    required
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    maxLength={23}
                    value={card.number}
                    onChange={(e) => onCardChange({ ...card, number: formatCardNumber(e.target.value) })}
                    error={fieldErrors.cardNumber}
                    className="tabular-nums"
                    trailingElement={
                      hasDigits ? (
                        <Badge variant={brand === 'Card' ? 'neutral' : 'info'} size="sm" aria-label={`Card type: ${brand}`}>
                          {brand}
                        </Badge>
                      ) : undefined
                    }
                  />
                  <Input
                    label="Name on card"
                    required
                    autoComplete="cc-name"
                    placeholder="As printed on the card"
                    maxLength={60}
                    value={card.name}
                    onChange={(e) => onCardChange({ ...card, name: e.target.value })}
                    error={fieldErrors.cardName}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Expiry (MM/YY)"
                      required
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      maxLength={7}
                      value={card.expiry}
                      onChange={(e) => onCardChange({ ...card, expiry: formatCardExpiry(e.target.value) })}
                      error={fieldErrors.cardExpiry}
                      className="tabular-nums"
                    />
                    <Input
                      label="CVC"
                      required
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="•••"
                      maxLength={4}
                      value={card.cvc}
                      onChange={(e) => onCardChange({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      error={fieldErrors.cardCvc}
                      className="tabular-nums"
                    />
                  </div>
                  <p className="text-[12px] text-ink-3">Card details are used for this payment only and are never stored.</p>
                  <TestModeBox method="CARD" onFill={fillCard} />
                </div>
              )}

              {checked && method.id === 'UPI' && (
                <div className="flex flex-col gap-4 rounded-b-sm border border-t-0 border-ink bg-surface/50 p-4 animate-fade-in">
                  <Input
                    label="UPI ID"
                    required
                    inputMode="email"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="yourname@bank"
                    maxLength={80}
                    value={upiId}
                    onChange={(e) => onUpiChange(e.target.value)}
                    error={fieldErrors.upiId}
                    hint="A collect request is sent to this ID when you place the order."
                  />
                  <TestModeBox method="UPI" onFill={onUpiChange} />
                </div>
              )}
            </div>
          );
        })}
      </fieldset>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack} className="px-0">
          Back
        </Button>
        <Button type="submit" className="sm:min-w-[200px]">
          Continue
        </Button>
      </div>
    </form>
  );
}

export default PaymentStep;
