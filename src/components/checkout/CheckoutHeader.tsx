import Link from 'next/link';
import { LogoMark } from '@/components/Logo';

export type CheckoutStage = 'bag' | 'address' | 'payment';

const STAGES: readonly { id: CheckoutStage; label: string; href?: string }[] = [
  { id: 'bag', label: 'Bag', href: '/cart' },
  { id: 'address', label: 'Address' },
  { id: 'payment', label: 'Payment' },
];

function ShieldIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4 6v6c0 4.6 3.4 8.4 8 9 4.6-.6 8-4.4 8-9V6l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/**
 * Myntra-style checkout bar: logo · BAG — ADDRESS — PAYMENT · 100% SECURE.
 * Rendered directly under the global header on the cart and checkout pages.
 */
export function CheckoutHeader({ stage }: { stage: CheckoutStage }) {
  const currentIndex = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Couture home">
          <LogoMark className="h-9 w-9" />
        </Link>

        <ol className="flex items-center" aria-label="Checkout progress">
          {STAGES.map((item, index) => {
            const isCurrent = index === currentIndex;
            const isDone = index < currentIndex;
            const labelClass = `text-[12px] font-bold uppercase tracking-widest leading-none pb-1 border-b-2 transition-colors duration-150 ${
              isCurrent ? 'border-success text-success' : isDone ? 'border-transparent text-success' : 'border-transparent text-ink-3'
            }`;
            return (
              <li key={item.id} className="flex items-center">
                {isDone && item.href ? (
                  <Link href={item.href} className={`${labelClass} hover:text-ink`}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={labelClass} aria-current={isCurrent ? 'step' : undefined}>
                    {item.label}
                  </span>
                )}
                {index < STAGES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`mx-2 w-6 border-t border-dashed sm:mx-4 sm:w-14 ${isDone ? 'border-success' : 'border-line-strong'}`}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <p className="hidden shrink-0 items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-2 sm:flex">
          <ShieldIcon />
          100% Secure
        </p>
        <span className="w-9 shrink-0 sm:hidden" aria-hidden="true" />
      </div>
    </div>
  );
}

export default CheckoutHeader;
