import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for does not exist or has moved.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <span
        aria-hidden="true"
        className="animate-fade-in-up bg-gradient-to-r from-brand to-discount bg-clip-text text-[96px] font-extrabold leading-none tracking-tight text-transparent sm:text-[128px]"
      >
        404
      </span>
      <h1 className="mt-6 text-[22px] font-bold uppercase tracking-[0.15em] text-ink sm:text-[26px]">We couldn&rsquo;t find that page</h1>
      <p className="mt-3 max-w-md text-[14px] leading-6 text-ink-3">
        The link may be broken or the page may have moved. Head back home or keep browsing the full catalogue.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-sm bg-brand px-8 text-[14px] font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Back to home
        </Link>
        <Link
          href="/products"
          className="inline-flex h-12 items-center justify-center rounded-sm border border-line-strong bg-white px-8 text-[14px] font-bold uppercase tracking-wide text-ink transition-colors duration-150 hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Shop all
        </Link>
      </div>
      <p className="mt-6 text-[13px] text-ink-3">
        Think this is a mistake?{' '}
        <Link href="/contact" className="font-bold text-brand hover:underline">
          Contact us
        </Link>
      </p>
    </div>
  );
}
