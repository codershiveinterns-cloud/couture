import type { ReactNode } from 'react';

export interface AuthCardProps {
  /** Friendly headline shown in the banner block above the form, e.g. "Welcome back". */
  eyebrow: string;
  /** Small brand-coloured tagline under the headline. */
  tagline?: string;
  title: string;
  /** Optional lighter suffix after the title, e.g. "or Signup". */
  titleSuffix?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({
  eyebrow,
  tagline = 'Couture — fashion, electronics, home & beauty',
  title,
  titleSuffix,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full items-start justify-center bg-[linear-gradient(135deg,#fff5f0,#ffe9ef)] px-4 py-8 sm:items-center sm:py-14">
      <div className="w-full max-w-[400px] animate-fade-in">
        <div className="overflow-hidden rounded-sm bg-white shadow-[0_4px_12px_rgba(40,44,63,0.08)]">
          <div className="flex h-[110px] flex-col justify-center bg-[#fff3e0] px-8">
            <p className="text-[20px] font-bold leading-tight text-ink">{eyebrow}</p>
            <p className="mt-1.5 text-[12px] font-bold text-brand">{tagline}</p>
          </div>
          <div className="px-8 pb-8 pt-7">
            <h1 className="text-[20px] font-bold text-ink">
              {title}
              {titleSuffix && <span className="font-normal text-ink-3"> {titleSuffix}</span>}
            </h1>
            {description && <p className="mt-1.5 text-[13px] text-ink-3">{description}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
        {footer && <p className="mt-5 text-center text-[13px] text-ink-2">{footer}</p>}
      </div>
    </div>
  );
}

export default AuthCard;
