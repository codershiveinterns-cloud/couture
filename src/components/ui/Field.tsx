import type { ReactNode } from 'react';

export interface FieldProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  /** Extra content on the right of the label row, e.g. "Forgot password?" link. */
  labelAddon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const fieldHintId = (id: string) => `${id}-hint`;
export const fieldErrorId = (id: string) => `${id}-error`;

export function describedBy(id: string, hasHint: boolean, hasError: boolean): string | undefined {
  const ids = [hasError ? fieldErrorId(id) : null, hasHint ? fieldHintId(id) : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export const CONTROL_CLASS =
  'block w-full rounded-sm border bg-white text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-4 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-4';
export const CONTROL_VALID_CLASS = 'border-line-strong hover:border-ink-4 focus:border-ink';
export const CONTROL_INVALID_CLASS = 'border-brand focus:border-brand';

export function controlClassName(invalid: boolean, extra = ''): string {
  return `${CONTROL_CLASS} ${invalid ? CONTROL_INVALID_CLASS : CONTROL_VALID_CLASS} ${extra}`.trim();
}

export function Field({ id, label, hint, error, required, labelAddon, className = '', children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || labelAddon) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-wide text-ink-3">
              {label}
              {required && (
                <span aria-hidden="true" className="ml-0.5 text-brand">
                  *
                </span>
              )}
            </label>
          )}
          {labelAddon && <span className="text-[12px] text-ink-3">{labelAddon}</span>}
        </div>
      )}
      {children}
      {error ? (
        <p id={fieldErrorId(id)} role="alert" className="text-[12px] font-medium text-brand">
          {error}
        </p>
      ) : hint ? (
        <p id={fieldHintId(id)} className="text-[12px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default Field;
