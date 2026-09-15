import Link from 'next/link';
import type { PaginationMeta } from '@/lib/types';

const BUTTON =
  'flex h-9 min-w-9 items-center justify-center rounded-sm border text-[14px] font-bold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

export default function Pagination({
  meta,
  basePath,
  searchParams,
}: {
  meta: PaginationMeta;
  basePath: string;
  /** Pass the page's raw searchParams so every current param survives paging. */
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (meta.totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === 'page') return;
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === 'string' && first !== '') params.set(key, first);
    });
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1,
  );

  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav
      className="mt-10 flex flex-col items-center gap-4 border-t border-line pt-6 sm:flex-row sm:justify-between"
      aria-label="Pagination"
    >
      <p className="text-[13px] text-ink-3">
        Showing{' '}
        <span className="font-bold text-ink">
          {from}–{to}
        </span>{' '}
        of <span className="font-bold text-ink">{meta.total}</span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PageLink href={buildHref(Math.max(meta.page - 1, 1))} disabled={meta.page === 1} rel="prev">
          Previous
        </PageLink>

        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />

        {pages.map((page, idx) => {
          const prevPage = pages[idx - 1];
          const showEllipsis = prevPage && page - prevPage > 1;
          const active = page === meta.page;
          return (
            <span key={page} className="flex items-center gap-2">
              {showEllipsis && (
                <span className="px-1 text-ink-4" aria-hidden="true">
                  &hellip;
                </span>
              )}
              <Link
                href={buildHref(page)}
                aria-current={active ? 'page' : undefined}
                aria-label={`Page ${page}`}
                className={`${BUTTON} px-2 ${
                  active ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink hover:border-ink'
                }`}
              >
                {page}
              </Link>
            </span>
          );
        })}

        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />

        <PageLink href={buildHref(Math.min(meta.page + 1, meta.totalPages))} disabled={meta.page === meta.totalPages} rel="next">
          Next
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  rel,
  children,
}: {
  href: string;
  disabled: boolean;
  rel: 'prev' | 'next';
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${BUTTON} cursor-not-allowed border-line bg-white px-4 text-ink-4`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} rel={rel} className={`${BUTTON} border-line-strong bg-white px-4 text-ink hover:border-ink`}>
      {children}
    </Link>
  );
}
