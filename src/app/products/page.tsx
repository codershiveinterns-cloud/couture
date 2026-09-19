import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCategories, getProducts, parseProductQuery } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import SortSelect from '@/components/SortSelect';
import FilterSidebar from '@/components/catalog/FilterSidebar';
import MobileFilterDrawer from '@/components/catalog/MobileFilterDrawer';
import ActiveFilterChips from '@/components/catalog/ActiveFilterChips';
import { buildCatalogHref, toCatalogFilters } from '@/components/catalog/catalogParams';

export const metadata: Metadata = {
  title: 'Shop All Products',
};

// Render per-request so catalog changes show without a rebuild.
export const dynamic = 'force-dynamic';

const BASE_PATH = '/products';

export default async function ProductsPage({ searchParams }: PageProps<'/products'>) {
  const sp = await searchParams;
  const query = parseProductQuery(sp);
  const filters = toCatalogFilters(query);

  const [categories, result] = await Promise.all([getCategories(), getProducts({ ...query, pageSize: 12 })]);

  const { q, category, featured } = result.query;
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

  const scopeHref = (slug: string | undefined) => buildCatalogHref(BASE_PATH, { ...filters, category: slug, page: 1 });
  const clearFiltersHref = buildCatalogHref(BASE_PATH, {
    q: filters.q,
    featured: filters.featured,
    sort: filters.sort,
    page: 1,
    brands: [],
    colors: [],
    sizes: [],
    inStock: false,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-12">
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

      <div className="mt-5 flex flex-col border-t border-line pt-5 lg:flex-row lg:items-start">
        {/* Desktop filter sidebar */}
        <div className="hidden w-60 shrink-0 border-r border-line lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <Suspense fallback={<SidebarFallback />}>
            <FilterSidebar basePath={BASE_PATH} facets={result.facets} categories={categories} />
          </Suspense>
        </div>

        <div className="min-w-0 flex-1 lg:pl-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
              <SortSelect basePath={BASE_PATH} current={result.query.sort} className="hidden lg:flex" />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <ActiveFilterChips basePath={BASE_PATH} categories={categories} className="mt-4" />
          </Suspense>

          {/* Mobile SORT | FILTER bar */}
          <Suspense fallback={null}>
            <MobileFilterDrawer
              basePath={BASE_PATH}
              facets={result.facets}
              categories={categories}
              resultCount={total}
              className="lg:hidden"
            />
          </Suspense>

          {result.data.length === 0 ? (
            <EmptyResults
              title={q ? `No results for “${q}”` : 'No products match these filters'}
              description={
                q
                  ? 'Try fewer filters, check the spelling, or search for something broader like “headphones” or “jacket”.'
                  : 'Try removing a filter or widening the price range to see more products.'
              }
              clearHref={clearFiltersHref}
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
      </div>
    </div>
  );
}

function SidebarFallback() {
  return (
    <div className="flex flex-col gap-3 pr-5" aria-hidden="true">
      <div className="h-8 w-24 animate-pulse rounded-sm bg-surface" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-4 w-full animate-pulse rounded-sm bg-surface" />
      ))}
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

function EmptyResults({ title, description, clearHref }: { title: string; description: string; clearHref: string }) {
  return (
    <div className="mt-6 flex flex-col items-center border border-line px-6 py-14 text-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink-4" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35M8 11h6" strokeLinecap="round" />
      </svg>
      <h2 className="mt-4 text-[18px] font-bold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-md text-[14px] text-ink-3">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={clearHref}
          className="inline-flex h-11 items-center rounded-sm bg-brand px-6 text-[14px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
        >
          Clear filters
        </Link>
        <Link
          href="/products"
          className="inline-flex h-11 items-center rounded-sm border border-line-strong bg-white px-6 text-[14px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink"
        >
          View all products
        </Link>
      </div>
    </div>
  );
}
