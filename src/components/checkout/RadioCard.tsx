import type { ReactNode } from 'react';

export interface RadioCardProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onChange(value: string): void;
  children: ReactNode;
}

export function RadioCard({ id, name, value, checked, disabled = false, onChange, children }: RadioCardProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 rounded-sm border bg-white p-4 transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 ${
          checked ? 'border-ink' : 'border-line hover:border-line-strong'
        }`}
      >
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            checked ? 'border-brand' : 'border-line-strong bg-white'
          }`}
        >
          {checked && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </label>
    </div>
  );
}

export default RadioCard;
