import Link from 'next/link';
import type { PaginationMeta } from '@/lib/types';

export default function Pagination({
  meta,
  basePath,
  searchParams,
}: {
  meta: PaginationMeta;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (meta.totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, value);
    });
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1,
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <PageLink href={buildHref(Math.max(meta.page - 1, 1))} disabled={meta.page === 1}>
        Prev
      </PageLink>

      {pages.map((page, idx) => {
        const prevPage = pages[idx - 1];
        const showEllipsis = prevPage && page - prevPage > 1;
        return (
          <span key={page} className="flex items-center gap-1">
            {showEllipsis && <span className="px-1 text-ink/30">&hellip;</span>}
            <Link
              href={buildHref(page)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-medium transition-colors duration-150 ${
                page === meta.page ? 'bg-ink text-white shadow-sm' : 'text-ink/60 hover:bg-ink/5'
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}

      <PageLink href={buildHref(Math.min(meta.page + 1, meta.totalPages))} disabled={meta.page === meta.totalPages}>
        Next
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="flex h-9 items-center justify-center rounded-full px-3 text-sm font-medium text-ink/25">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="flex h-9 items-center justify-center rounded-full px-3 text-sm font-medium text-ink/60 transition-colors duration-150 hover:bg-ink/5 hover:text-brand"
    >
      {children}
    </Link>
  );
}
