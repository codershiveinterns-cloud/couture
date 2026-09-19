import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCategoryBySlug, getProducts, parseProductQuery } from '@/lib/api';
import FadeImage from '@/components/FadeImage';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import SortSelect from '@/components/SortSelect';
import FilterSidebar from '@/components/catalog/FilterSidebar';
import MobileFilterDrawer from '@/components/catalog/MobileFilterDrawer';
import ActiveFilterChips from '@/components/catalog/ActiveFilterChips';
import { buildCatalogHref, toCatalogFilters } from '@/components/catalog/catalogParams';

// Render per-request so catalog changes show without a rebuild.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/categories/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found' };
  return { title: category.name, description: category.description || undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps<'/categories/[slug]'>) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const basePath = `/categories/${slug}`;
  const query = parseProductQuery(sp);
  const filters = toCatalogFilters(query);
  const result = await getProducts({ ...query, category: slug, pageSize: 12 });
  const { q } = result.query;
  const total = result.meta.total;
  const hasFilters = result.facets.total > 0;

  const clearFiltersHref = buildCatalogHref(basePath, {
    q: filters.q,
    featured: false,
    sort: filters.sort,
    page: 1,
    brands: [],
    colors: [],
    sizes: [],
    inStock: false,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-12">
      {/* Hero banner */}
      <section
        aria-label={`${category.name} banner`}
        className="relative mb-6 aspect-[16/7] w-full overflow-hidden rounded-sm bg-ink sm:aspect-[21/6]"
      >
        {category.imageUrl && (
          <FadeImage
            src={category.imageUrl}
            alt=""
            fill
            priority
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-cover"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/5" />
        <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-10">
          <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
            {total === 1 ? '1 item' : `${total} items`}
          </span>
          <h1 className="mt-2 text-[28px] font-bold uppercase leading-none tracking-[0.15em] text-white sm:text-[40px] lg:text-[48px]">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 max-w-xl text-[13px] leading-snug text-white/85 sm:text-[15px]">{category.description}</p>
          )}
        </div>
      </section>

      <nav aria-label="Breadcrumb" className="text-[14px] text-ink-2">
        <Link href="/" className="transition-colors hover:text-ink">
          Home
        </Link>
        <span className="mx-1.5 text-ink-4">/</span>
        <Link href="/products" className="transition-colors hover:text-ink">
          Shop
        </Link>
        <span className="mx-1.5 text-ink-4">/</span>
        <span className="font-bold text-ink">{category.name}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-[16px] font-bold text-ink">{q ? `${category.name} matching “${q}”` : category.name}</h2>
        <span className="text-[14px] text-ink-3">- {total === 1 ? '1 item' : `${total} items`}</span>
      </div>

      <div className="mt-5 flex flex-col border-t border-line pt-5 lg:flex-row lg:items-start">
        {/* Desktop filter sidebar */}
        <div className="hidden w-60 shrink-0 border-r border-line lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <Suspense fallback={<SidebarFallback />}>
            <FilterSidebar basePath={basePath} facets={result.facets} />
          </Suspense>
        </div>

        <div className="min-w-0 flex-1 lg:pl-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px] text-ink-3">
              {result.meta.totalPages > 1 ? `Page ${result.meta.page} of ${result.meta.totalPages}` : ''}
            </span>
            <Suspense fallback={null}>
              <SortSelect basePath={basePath} current={result.query.sort} className="hidden lg:flex" />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <ActiveFilterChips basePath={basePath} hideCategory className="mt-4" />
          </Suspense>

          {/* Mobile SORT | FILTER bar */}
          <Suspense fallback={null}>
            <MobileFilterDrawer basePath={basePath} facets={result.facets} resultCount={total} className="lg:hidden" />
          </Suspense>

          {result.data.length === 0 ? (
            <div className="mt-6 flex flex-col items-center border border-line px-6 py-14 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink-4" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35M8 11h6" strokeLinecap="round" />
              </svg>
              <h2 className="mt-4 text-[18px] font-bold text-ink">
                {q
                  ? `No ${category.name.toLowerCase()} products match “${q}”`
                  : hasFilters
                    ? 'No products match these filters'
                    : 'No products in this category yet'}
              </h2>
              <p className="mt-1.5 max-w-md text-[14px] text-ink-3">
                {q || hasFilters
                  ? 'Try removing a filter or widening the price range to see more products.'
                  : 'Check back soon or browse the rest of the store.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {hasFilters && (
                  <Link
                    href={clearFiltersHref}
                    className="inline-flex h-11 items-center rounded-sm bg-brand px-6 text-[14px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark"
                  >
                    Clear filters
                  </Link>
                )}
                <Link
                  href={q ? basePath : '/products'}
                  className="inline-flex h-11 items-center rounded-sm border border-line-strong bg-white px-6 text-[14px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink"
                >
                  {q ? `Browse all ${category.name}` : 'Browse all products'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              {result.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination meta={result.meta} basePath={basePath} searchParams={sp} />
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
