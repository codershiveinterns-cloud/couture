import type { ComponentProps, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends Omit<ComponentProps<'span'>, 'children'> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Leading dot in the variant colour. */
  dot?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-surface text-ink-2',
  brand: 'bg-brand-light text-brand',
  success: 'bg-[#e6f7f3] text-success',
  warning: 'bg-[#fff3e8] text-discount',
  danger: 'bg-brand-light text-brand-dark',
  info: 'bg-[#e7f5f4] text-rating',
  outline: 'border border-line-strong bg-white text-ink-2',
};

const DOTS: Record<BadgeVariant, string> = {
  neutral: 'bg-ink-3',
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-discount',
  danger: 'bg-brand-dark',
  info: 'bg-rating',
  outline: 'bg-ink-3',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-[11px]',
};

export function Badge({ variant = 'neutral', size = 'md', dot = false, className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm font-bold uppercase tracking-wide ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {dot && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOTS[variant]}`} />}
      {children}
    </span>
  );
}

export default Badge;
