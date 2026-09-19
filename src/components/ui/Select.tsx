import { useId, type ComponentProps, type ReactNode } from 'react';
import { controlClassName, describedBy, Field } from './Field';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<ComponentProps<'select'>, 'id' | 'children'> {
  id?: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  labelAddon?: ReactNode;
  /** Either pass `options` or your own <option> children. */
  options?: readonly (SelectOption | string)[];
  placeholder?: string;
  wrapperClassName?: string;
  children?: ReactNode;
}

export function Select({
  id: idProp,
  label,
  hint,
  error,
  labelAddon,
  options,
  placeholder,
  wrapperClassName = '',
  className = '',
  required,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const invalid = !!error;

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} labelAddon={labelAddon} className={wrapperClassName}>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(id, !!hint, invalid)}
          className={controlClassName(invalid, `h-11 appearance-none pl-3 pr-10 ${className}`)}
          {...rest}
        >
          {placeholder !== undefined && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options?.map((option) => {
            const item = typeof option === 'string' ? { value: option, label: option } : option;
            return (
              <option key={item.value} value={item.value} disabled={item.disabled}>
                {item.label}
              </option>
            );
          })}
          {children}
        </select>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Field>
  );
}

export default Select;
