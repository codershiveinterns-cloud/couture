import { useId, type ComponentProps, type ReactNode } from 'react';
import { controlClassName, describedBy, Field } from './Field';

export interface InputProps extends Omit<ComponentProps<'input'>, 'id' | 'size'> {
  id?: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  labelAddon?: ReactNode;
  leadingIcon?: ReactNode;
  trailingElement?: ReactNode;
  wrapperClassName?: string;
}

export function Input({
  id: idProp,
  label,
  hint,
  error,
  labelAddon,
  leadingIcon,
  trailingElement,
  wrapperClassName = '',
  className = '',
  required,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const invalid = !!error;
  const padding = `${leadingIcon ? 'pl-10' : 'pl-3'} ${trailingElement ? 'pr-11' : 'pr-3'}`;

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} labelAddon={labelAddon} className={wrapperClassName}>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-3">{leadingIcon}</span>
        )}
        <input
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(id, !!hint, invalid)}
          className={controlClassName(invalid, `h-11 ${padding} ${className}`)}
          {...rest}
        />
        {trailingElement && <span className="absolute inset-y-0 right-2 flex items-center">{trailingElement}</span>}
      </div>
    </Field>
  );
}

export default Input;
