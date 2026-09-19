import { useId, type ComponentProps, type ReactNode } from 'react';
import { fieldErrorId } from './Field';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'id' | 'type' | 'size'> {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export function Checkbox({
  id: idProp,
  label,
  description,
  error,
  wrapperClassName = '',
  className = '',
  disabled,
  ...rest
}: CheckboxProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const invalid = !!error;

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      <label
        htmlFor={id}
        className={`flex items-start gap-3 text-sm ${disabled ? 'cursor-not-allowed text-ink-4' : 'cursor-pointer text-ink-2'}`}
      >
        <input
          id={id}
          type="checkbox"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? fieldErrorId(id) : undefined}
          className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-sm border bg-white transition-colors duration-150 checked:border-brand checked:bg-brand checked:bg-[url("data:image/svg+xml,%3csvg%20xmlns%3d%27http%3a//www.w3.org/2000/svg%27%20viewBox%3d%270%200%2016%2016%27%20fill%3d%27none%27%20stroke%3d%27white%27%20stroke-width%3d%272.2%27%20stroke-linecap%3d%27round%27%20stroke-linejoin%3d%27round%27%3e%3cpath%20d%3d%27M3.5%208.5l3%203%206-7%27/%3e%3c/svg%3e")] checked:bg-center checked:bg-no-repeat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
            invalid ? 'border-brand' : 'border-line-strong hover:border-ink'
          } ${className}`}
          {...rest}
        />
        <span className="flex flex-col gap-0.5 leading-snug">
          <span>{label}</span>
          {description && <span className="text-[12px] text-ink-3">{description}</span>}
        </span>
      </label>
      {error && (
        <p id={fieldErrorId(id)} role="alert" className="text-[12px] font-medium text-brand">
          {error}
        </p>
      )}
    </div>
  );
}

export default Checkbox;
