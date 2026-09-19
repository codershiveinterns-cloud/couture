'use client';

import { useId, useState } from 'react';

export interface QuantityStepperProps {
  value: number;
  /** Called with the clamped next value; never called when the value would not change. */
  onChange(next: number): void;
  min?: number;
  /** Usually the available stock. Values above are clamped. */
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** Accessible name for the group, e.g. "Quantity for Aurora Lamp". */
  label?: string;
  id?: string;
  className?: string;
}

export function clampQuantity(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), Math.max(min, max));
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  disabled = false,
  size = 'md',
  label = 'Quantity',
  id: idProp,
  className = '',
}: QuantityStepperProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [draft, setDraft] = useState<string | null>(null);
  const upper = Math.max(min, max);
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < upper;

  const commit = (next: number) => {
    const clamped = clampQuantity(next, min, upper);
    if (clamped !== value) onChange(clamped);
  };

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(parsed)) commit(parsed);
  };

  const buttonSize = size === 'sm' ? 'h-8 w-8 text-base' : 'h-10 w-10 text-lg';
  const inputSize = size === 'sm' ? 'h-8 w-9 text-xs' : 'h-10 w-12 text-sm';

  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex items-center rounded-sm border border-line-strong bg-white ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <button
        type="button"
        onClick={() => commit(value - 1)}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
        aria-controls={id}
        className={`flex items-center justify-center rounded-sm text-ink-2 transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink disabled:cursor-not-allowed disabled:text-ink-4 disabled:hover:bg-transparent ${buttonSize}`}
      >
        <span aria-hidden="true">−</span>
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft ?? String(value)}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ''))}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitDraft();
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            commit(value + 1);
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            commit(value - 1);
          }
        }}
        className={`border-x border-line bg-transparent text-center font-bold tabular-nums text-ink outline-none focus-visible:text-brand disabled:cursor-not-allowed ${inputSize}`}
      />
      <button
        type="button"
        onClick={() => commit(value + 1)}
        disabled={!canIncrement}
        aria-label="Increase quantity"
        aria-controls={id}
        className={`flex items-center justify-center rounded-sm text-ink-2 transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink disabled:cursor-not-allowed disabled:text-ink-4 disabled:hover:bg-transparent ${buttonSize}`}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

export default QuantityStepper;
