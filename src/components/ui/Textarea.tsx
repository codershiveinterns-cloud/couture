import { useId, type ComponentProps, type ReactNode } from 'react';
import { controlClassName, describedBy, Field } from './Field';

export interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'id'> {
  id?: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  labelAddon?: ReactNode;
  /** Shows "n / max" under the field (pass `maxLength` too to hard-limit input). */
  showCount?: boolean;
  wrapperClassName?: string;
}

export function Textarea({
  id: idProp,
  label,
  hint,
  error,
  labelAddon,
  showCount,
  wrapperClassName = '',
  className = '',
  required,
  rows = 4,
  value,
  maxLength,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const invalid = !!error;
  const length = typeof value === 'string' ? value.length : 0;
  const count =
    showCount && typeof value === 'string' ? (
      <span className="tabular-nums">
        {length}
        {maxLength ? ` / ${maxLength}` : ''}
      </span>
    ) : null;

  return (
    <Field
      id={id}
      label={label}
      hint={hint ?? count}
      error={error}
      required={required}
      labelAddon={labelAddon ?? (hint && count ? count : undefined)}
      className={wrapperClassName}
    >
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(id, !!(hint ?? count), invalid)}
        className={controlClassName(invalid, `resize-y px-3 py-2.5 leading-relaxed ${className}`)}
        {...rest}
      />
    </Field>
  );
}

export default Textarea;
