export const CHECKOUT_STEPS = ['Address', 'Payment', 'Review'] as const;
export type CheckoutStep = 0 | 1 | 2;

/** Compact in-panel step tabs (the page-level BAG — ADDRESS — PAYMENT bar lives in CheckoutHeader). */
export function CheckoutStepper({ current, onSelect }: { current: CheckoutStep; onSelect(step: CheckoutStep): void }) {
  return (
    <ol className="flex items-end gap-5 border-b border-line sm:gap-8" aria-label="Checkout steps">
      {CHECKOUT_STEPS.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        const reachable = index < current;
        return (
          <li key={label} className="-mb-px">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onSelect(index as CheckoutStep)}
              aria-current={state === 'current' ? 'step' : undefined}
              className={`flex items-center gap-1.5 border-b-2 pb-2.5 text-[12px] font-bold uppercase tracking-[0.15em] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/30 ${
                state === 'current'
                  ? 'border-success text-success'
                  : state === 'done'
                    ? 'cursor-pointer border-transparent text-ink hover:text-success'
                    : 'cursor-default border-transparent text-ink-4'
              }`}
            >
              <span aria-hidden="true" className="tabular-nums">
                {state === 'done' ? '✓' : `${index + 1}.`}
              </span>
              <span className="whitespace-nowrap">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export default CheckoutStepper;
