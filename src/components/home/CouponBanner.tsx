import Link from 'next/link';

export default function CouponBanner() {
  return (
    <section aria-label="Welcome offer" className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
      <Link
        href="/products"
        className="group flex items-center justify-between gap-3 rounded-sm border border-[#ffe1b8] bg-[#fff6e9] px-3 py-2 transition-colors duration-150 hover:bg-[#fff0dc] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:px-5 sm:py-2.5"
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-brand text-white sm:h-9 sm:w-9">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path
                d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <p className="min-w-0 truncate text-[13px] leading-tight text-ink-2 sm:text-[14px]">
            <span className="font-bold text-ink">Get 10% off</span> your first order with code{' '}
            <span className="inline-block rounded-sm border border-dashed border-brand bg-white px-1.5 py-0.5 text-[11px] font-bold tracking-[0.2em] text-brand">
              WELCOME10
            </span>
          </p>
        </div>
        <span className="shrink-0 text-[12px] font-bold uppercase tracking-wide text-brand transition-transform duration-200 group-hover:translate-x-0.5 sm:text-[13px]">
          Shop now <span aria-hidden>&rarr;</span>
        </span>
      </Link>
    </section>
  );
}
