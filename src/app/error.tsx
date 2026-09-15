'use client';

import Link from 'next/link';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l9.5 16.5H2.5L12 3z" />
          <path d="M12 10v4" />
          <path d="M12 17.5h.01" />
        </svg>
      </span>
      <h1 className="mt-6 text-[22px] font-bold uppercase tracking-[0.15em] text-ink sm:text-[26px]">Something went wrong</h1>
      <p className="mt-3 max-w-md text-[14px] leading-6 text-ink-3">
        We hit a snag loading this page. Try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-12 items-center justify-center rounded-sm bg-brand px-8 text-[14px] font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-sm border border-line-strong bg-white px-8 text-[14px] font-bold uppercase tracking-wide text-ink transition-colors duration-150 hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
