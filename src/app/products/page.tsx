import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCategories, getProducts, isProductSort } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import SortSelect from '@/components/SortSelect';

export const metadata: Metadata = {
  title: 'Shop All Products',
};

// Render per-request so catalog changes show without a rebuild.
export const dynamic = 'force-dynamic';

const BASE_PATH = '/products';

function first(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export default async function ProductsPage({ searchParams }: PageProps<'/products'>) {
  const sp = await searchParams;
  const page = Number(first(sp.page)) || 1;
  const category = first(sp.category);
  const q = first(sp.q)?.trim() || undefined;
  const rawSort = first(sp.sort);
  const sort = isProductSort(rawSort) ? rawSort : undefined;
  const featured = first(sp.featured) === 'true';

  const [categories, result] = await Promise.all([
    getCategories(),
    getProducts({ page, category, q, sort, featured, pageSize: 12 }),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);
  const total = result.meta.total;
  const allCount = categories.every((c) => typeof c.productCount === 'number')
    ? categories.reduce((sum, c) => sum + (c.productCount as number), 0)
    : undefined;

  const title = q
    ? `Search results for “${q}”`
    : activeCategory
      ? activeCategory.name
      : featured
        ? 'Featured Products'
        : 'All Products';

  const scopeHref = (slug: string | undefined) => {
    const params = new URLSearchParams();
    if (slug) params.set('category', slug);
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);
    if (featured) params.set('featured', 'true');
    const qs = params.toString();
    return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-[14px] text-ink-2">
        <Link href="/" className="transition-colors hover:text-ink">
          Home
        </Link>
        <span className="mx-1.5 text-ink-4">/</span>
        {activeCategory ? (
          <>
            <Link href="/products" className="transition-colors hover:text-ink">
              Shop
            </Link>
            <span className="mx-1.5 text-ink-4">/</span>
            <span className="font-bold text-ink">{activeCategory.name}</span>
          </>
        ) : (
          <span className="font-bold text-ink">Shop</span>
        )}
      </nav>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <h1 className="text-[16px] font-bold text-ink">{title}</h1>
        <span className="text-[14px] text-ink-3">- {total === 1 ? '1 item' : `${total} items`}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div role="list" aria-label="Browse by category" className="flex min-w-0 flex-wrap items-center gap-2">
          <ScopeChip href={scopeHref(undefined)} active={!category} count={allCount}>
            All
          </ScopeChip>
          {categories.map((cat) => (
            <ScopeChip key={cat.id} href={scopeHref(cat.slug)} active={category === cat.slug} count={cat.productCount}>
              {cat.name}
            </ScopeChip>
          ))}
        </div>
        <Suspense fallback={null}>
          <SortSelect basePath={BASE_PATH} current={sort} />
        </Suspense>
      </div>

      {result.data.length === 0 ? (
        <EmptyResults
          title={q ? `No results for “${q}”` : 'No products found'}
          description={
            q
              ? 'Check the spelling or try a broader search term like “headphones” or “jacket”.'
              : 'Try another category or browse the full catalog.'
          }
        />
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
          {result.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination meta={result.meta} basePath={BASE_PATH} searchParams={sp} />
    </div>
  );
}

function ScopeChip({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="listitem"
      aria-current={active ? 'true' : undefined}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-bold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
        active ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink hover:border-ink'
      }`}
    >
      {children}
      {typeof count === 'number' && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums ${
            active ? 'bg-white/20 text-white' : 'bg-surface text-ink-3'
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function EmptyResults({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 flex flex-col items-center border border-line px-6 py-14 text-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink-4" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35M8 11h6" strokeLinecap="round" />
      </svg>
      <h2 className="mt-4 text-[18px] font-bold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-md text-[14px] text-ink-3">{description}</p>
      <Link
        href="/products"
        className="mt-6 inline-flex h-11 items-center rounded-sm border border-brand px-6 text-[14px] font-bold uppercase tracking-wide text-brand transition-colors hover:bg-brand-light"
      >
        View all products
      </Link>
    </div>
  );
}
