import Link from 'next/link';
import type { ReactNode } from 'react';

export default function SectionTitle({
  title,
  href,
  linkLabel = 'View all',
  id,
  aside,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  id?: string;
  /** Optional element rendered beside the title (e.g. a countdown chip). */
  aside?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:mb-7">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id={id} className="text-[22px] font-bold uppercase tracking-[0.15em] text-ink sm:text-[26px]">
          {title}
        </h2>
        {aside}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-[13px] font-bold uppercase tracking-wide text-brand transition-colors duration-150 hover:text-brand-dark hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {linkLabel} &rarr;
        </Link>
      )}
    </div>
  );
}
