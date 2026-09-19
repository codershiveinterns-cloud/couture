import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /** Inline SVG or emoji; rendered inside a soft circle. */
  icon?: ReactNode;
  /** Usually one or two <Button>s. */
  action?: ReactNode;
  /** compact = smaller paddings for inline panels (e.g. cart drawer). */
  size?: 'compact' | 'default';
  className?: string;
}

export function EmptyState({ title, description, icon, action, size = 'default', className = '' }: EmptyStateProps) {
  const compact = size === 'compact';
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-sm border border-line bg-white text-center animate-fade-in ${
        compact ? 'px-4 py-8' : 'px-6 py-14 sm:py-20'
      } ${className}`}
    >
      {icon && (
        <div
          aria-hidden="true"
          className={`mb-4 flex items-center justify-center rounded-full bg-surface text-ink-3 ${
            compact ? 'h-12 w-12 text-xl' : 'h-16 w-16 text-2xl'
          }`}
        >
          {icon}
        </div>
      )}
      <h2 className={`font-bold text-ink ${compact ? 'text-[16px]' : 'text-[18px]'}`}>{title}</h2>
      {description && <p className={`mt-2 max-w-md text-ink-3 ${compact ? 'text-[13px]' : 'text-sm'}`}>{description}</p>}
      {action && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>
      )}
    </div>
  );
}

export default EmptyState;
