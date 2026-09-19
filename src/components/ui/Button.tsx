import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Text announced/shown while loading (defaults to the children). */
  loadingText?: ReactNode;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export type ButtonAsButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps | 'href'> & { href?: undefined };

export type ButtonAsLinkProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps | 'href'> & {
    href: string;
    disabled?: boolean;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-ink-4 disabled:text-white',
  secondary:
    'border border-line-strong bg-white text-ink hover:border-ink disabled:border-line disabled:text-ink-4 disabled:hover:border-line',
  ghost: 'bg-transparent text-brand hover:underline disabled:text-ink-4 disabled:no-underline',
  danger: 'bg-ink text-white hover:bg-brand-dark disabled:bg-ink-4',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-4 text-[12px]',
  md: 'h-11 gap-2 px-5 text-sm',
  lg: 'h-[52px] gap-2 px-6 text-sm',
};

const BASE =
  'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-sm font-bold uppercase tracking-wide transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1 disabled:cursor-not-allowed';

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: Pick<ButtonBaseProps, 'variant' | 'size' | 'fullWidth' | 'className'>): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`.trim();
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    className = '',
    children,
    ...rest
  } = props;
  const classes = buttonClassName({ variant, size, fullWidth, className });
  const content = (
    <>
      {loading ? <Spinner size="xs" label="" /> : leadingIcon}
      {loading && loadingText !== undefined ? loadingText : children}
      {!loading && trailingIcon}
    </>
  );

  if (rest.href !== undefined) {
    const { href, disabled, prefetch, replace, scroll, onClick, ...anchorProps } = rest as Omit<
      ButtonAsLinkProps,
      keyof ButtonBaseProps
    >;
    const inert = disabled || loading;
    return (
      <Link
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        aria-disabled={inert || undefined}
        tabIndex={inert ? -1 : undefined}
        onClick={(event) => {
          if (inert) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        className={`${classes} ${inert ? 'pointer-events-none opacity-50' : ''}`}
        {...anchorProps}
      >
        {content}
      </Link>
    );
  }

  const { type = 'button', disabled, ...buttonProps } = rest as Omit<ButtonAsButtonProps, keyof ButtonBaseProps>;
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={classes} {...buttonProps}>
      {content}
    </button>
  );
}

export default Button;
