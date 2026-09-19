'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { describedBy, Field } from '@/components/ui/Field';

export const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

const RATINGS = [1, 2, 3, 4, 5] as const;

export interface StarInputProps {
  id: string;
  value: number;
  onChange(value: number): void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function StarIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 5.9 21l1.3-6.8-5-4.7 6.8-.8z" />
    </svg>
  );
}

export function StarInput({
  id,
  value,
  onChange,
  label = 'Your rating',
  hint,
  error,
  required,
  disabled,
  className = '',
}: StarInputProps) {
  const [hovered, setHovered] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const invalid = !!error;
  const display = hovered || value;
  const focusable = value || 1;

  const select = (next: number) => {
    onChange(next);
    buttons.current[next - 1]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const current = value || 0;
    let next: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(5, current + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(1, current - 1 || 1);
        break;
      case 'Home':
        next = 1;
        break;
      case 'End':
        next = 5;
        break;
      default:
        return;
    }
    event.preventDefault();
    select(next);
  };

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div
          id={id}
          role="radiogroup"
          aria-label="Rating"
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(id, !!hint, invalid)}
          onMouseLeave={() => setHovered(0)}
          className={`-ml-1 flex items-center ${invalid ? 'rounded-sm ring-2 ring-brand/20' : ''}`}
        >
          {RATINGS.map((rating) => {
            const checked = value === rating;
            const lit = rating <= display;
            return (
              <button
                key={rating}
                ref={(el) => {
                  buttons.current[rating - 1] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={`${rating} ${rating === 1 ? 'star' : 'stars'} – ${RATING_LABELS[rating]}`}
                tabIndex={rating === focusable ? 0 : -1}
                disabled={disabled}
                onClick={() => select(rating)}
                onKeyDown={onKeyDown}
                onMouseEnter={() => setHovered(rating)}
                onFocus={() => setHovered(0)}
                className={`flex h-9 w-9 items-center justify-center rounded-full outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed ${
                  lit ? 'text-rating' : 'text-line-strong hover:text-ink-4'
                }`}
              >
                <StarIcon className="h-6 w-6" />
              </button>
            );
          })}
        </div>
        <span aria-hidden="true" className="min-w-[7rem] text-[13px] text-ink-3">
          {display ? `${display}/5 · ${RATING_LABELS[display]}` : 'Select a rating'}
        </span>
      </div>
    </Field>
  );
}

export default StarInput;
