'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Admin-scoped error boundary. Renders inside the admin shell (sidebar stays usable) so an
 * error on one screen never takes the whole back office down.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the failure for whoever is watching the console; no error-reporting service yet.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:py-24">
      <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l9.5 16.5H2.5L12 3z" />
          <path d="M12 10v4" />
          <path d="M12 17.5h.01" />
        </svg>
      </span>
      <h1 className="mt-5 text-[20px] font-bold text-ink">This admin screen hit an error</h1>
      <p className="mt-2 max-w-md text-[14px] leading-6 text-ink-3">
        Nothing has been lost — your data is still saved. Try the screen again, or go back to the dashboard.
      </p>
      {error.digest && <p className="mt-2 text-[12px] text-ink-4">Reference: {error.digest}</p>}
      <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-11 items-center justify-center rounded-sm bg-brand px-6 text-[14px] font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="inline-flex h-11 items-center justify-center rounded-sm border border-line-strong bg-white px-6 text-[14px] font-bold uppercase tracking-wide text-ink transition-colors duration-150 hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
