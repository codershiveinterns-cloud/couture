'use client';

import Link from 'next/link';
import { Suspense, useMemo, type ReactNode } from 'react';
import { listCategories, parseProductQuery, queryProducts, toCategorySummary } from '@/lib/api';
import type { CategorySummary, ProductSearchResult } from '@/lib/types';
import FadeImage from '@/components/FadeImage';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import Pagination from '@/components/Pagination';
import SortSelect from '@/components/SortSelect';
import FilterSidebar from '@/components/catalog/FilterSidebar';
import MobileFilterDrawer from '@/components/catalog/MobileFilterDrawer';
import ActiveFilterChips from '@/components/catalog/ActiveFilterChips';
import { buildCatalogHref, toCatalogFilters } from '@/components/catalog/catalogParams';
import { useLiveCatalog } from './useLiveCatalog';

export type RawSearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 12;
const PRIMARY_LINK =
  'inline-flex h-11 items-center rounded-sm bg-brand px-6 text-[14px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark outline-none focus-visible:ring-2 focus-visible:ring-brand/40';
const SECONDARY_LINK =
  'inline-flex h-11 items-center rounded-sm border border-line-strong bg-white px-6 text-[14px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

const itemsLabel = (total: number) => (total === 1 ? '1 item' : `${total} items`);

export interface LiveProductGridProps {
  /** '/products' or '/categories/<slug>'. */
  basePath: string;
  /** Raw page searchParams, re-parsed client-side with the effective categories. */
  searchParams: RawSearchParams;
  /** Server-rendered result from the base catalog; null only for an unknown category slug. */
  result: ProductSearchResult | null;
  /** /products: every category (scope chips + category filter). Omit on category pages. */
  categories?: CategorySummary[];
  /** Category pages: the slug from the URL and the base category (null when the server does not know it). */
  categorySlug?: string;
  category?: CategorySummary | null;
}

/**
 * Listing body for /products and /categories/[slug]. Renders the server result untouched until the
 * browser catalog is hydrated AND has admin overrides; then the grid, count, facets and pagination
 * are all recomputed from the effective published catalog with the same query.
 */
export default function LiveProductGrid({
  basePath,
  searchParams,
  result: serverResult,
  categories: serverCategories,
  categorySlug,
  category: serverCategory = null,
}: LiveProductGridProps) {
  const { isLive, isHydrated, publishedProducts, categories: liveCategories } = useLiveCatalog();
  const isCategoryPage = categorySlug !== undefined;

  // Same parse as the server; with overrides the effective categories validate `?category=`.
  const query = useMemo(
    () => (isLive ? parseProductQuery(searchParams, liveCategories) : parseProductQuery(searchParams)),
    [isLive, searchParams, liveCategories],
  );

  const live = useMemo(() => {
    if (!isLive) return null;
    const record = isCategoryPage ? liveCategories.find((c) => c.slug === categorySlug) : undefined;
    if (isCategoryPage && !record) return { result: null, category: null, categories: listCategories(liveCategories) };
    return {
      result: queryProducts(publishedProducts, liveCategories, {
        ...query,
        ...(isCategoryPage ? { category: categorySlug } : {}),
        pageSize: PAGE_SIZE,
      }),
      category: record ? toCategorySummary(record) : null,
      categories: listCategories(liveCategories),
    };
  }, [isLive, query, liveCategories, publishedProducts, isCategoryPage, categorySlug]);

  const result = live ? live.result : serverResult;
  const category = live ? live.category : serverCategory;
  const categories = isCategoryPage ? undefined : live ? live.categories : serverCategories;

  if (isCategoryPage && (!result || !category)) {
    // Unknown to the server: wait for the browser catalog before deciding it does not exist.
    if (!isHydrated) return <ListingSkeleton />;
    return (
      <StatePanel
        title={serverCategory ? 'This category is no longer available' : 'We couldn’t find that category'}
        description="It may have been renamed or removed. Browse the full catalogue instead."
      />
    );
  }
  if (!result) return <ListingSkeleton />;

  const { q, category: activeSlug, featured } = result.query;
  const total = result.meta.total;
  const filters = toCatalogFilters(query);
  const activeCategory = categories?.find((c) => c.slug === activeSlug);
  const allCount = categories?.every((c) => typeof c.productCount === 'number')
    ? categories.reduce((sum, c) => sum + (c.productCount as number), 0)
    : undefined;
  const hasScope = result.facets.total > 0;

  const clearFiltersHref = buildCatalogHref(basePath, {
    q: filters.q,
    featured: isCategoryPage ? false : filters.featured,
    sort: filters.sort,
    page: 1,
    brands: [],
    colors: [],
    sizes: [],
    inStock: false,
  });
  const scopeHref = (slug: string | undefined) => buildCatalogHref(basePath, { ...filters, category: slug, page: 1 });

  const title = category
    ? q
      ? `${category.name} matching “${q}”`
      : category.name
    : q
      ? `Search results for “${q}”`
      : activeCategory
        ? activeCategory.name
        : featured
          ? 'Featured Products'
          : 'All Products';
  const crumb = category ?? activeCategory ?? null;
  const Heading = category ? 'h2' : 'h1';

  let empty: { title: string; description: string; showClear: boolean; browseHref: string; browseLabel: string };
  if (category) {
    empty = {
      title: q
        ? `No ${category.name.toLowerCase()} products match “${q}”`
        : hasScope
          ? 'No products match these filters'
          : 'No products in this category yet',
      description:
        q || hasScope
          ? 'Try removing a filter or widening the price range to see more products.'
          : 'Check back soon or browse the rest of the store.',
      showClear: hasScope,
      browseHref: q ? basePath : '/products',
      browseLabel: q ? `Browse all ${category.name}` : 'Browse all products',
    };
  } else {
    empty = {
      title: q ? `No results for “${q}”` : 'No products match these filters',
      description: q
        ? 'Try fewer filters, check the spelling, or search for something broader like “headphones” or “jacket”.'
        : 'Try removing a filter or widening the price range to see more products.',
      showClear: true,
      browseHref: '/products',
      browseLabel: 'View all products',
    };
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-12">
      {category && (
        <section
          aria-label={`${category.name} banner`}
          className="relative mb-6 aspect-[16/7] w-full overflow-hidden rounded-sm bg-ink sm:aspect-[21/6]"
        >
          {category.imageUrl && (
            <FadeImage
              key={category.imageUrl}
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
              {itemsLabel(total)}
            </span>
            <h1 className="mt-2 text-[28px] font-bold uppercase leading-none tracking-[0.15em] text-white sm:text-[40px] lg:text-[48px]">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-2 max-w-xl text-[13px] leading-snug text-white/85 sm:text-[15px]">{category.description}</p>
            )}
          </div>
        </section>
      )}

      <nav aria-label="Breadcrumb" className="text-[14px] text-ink-2">
        <Link href="/" className="transition-colors hover:text-ink">
          Home
        </Link>
        <span className="mx-1.5 text-ink-4">/</span>
        {crumb ? (
          <>
            <Link href="/products" className="transition-colors hover:text-ink">
              Shop
            </Link>
            <span className="mx-1.5 text-ink-4">/</span>
            <span className="font-bold text-ink">{crumb.name}</span>
          </>
        ) : (
          <span className="font-bold text-ink">Shop</span>
        )}
      </nav>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <Heading className="text-[16px] font-bold text-ink">{title}</Heading>
        <span className="text-[14px] text-ink-3">- {itemsLabel(total)}</span>
      </div>

      <div className="mt-5 flex flex-col border-t border-line pt-5 lg:flex-row lg:items-start">
        <div className="hidden w-60 shrink-0 border-r border-line lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <Suspense fallback={<SidebarFallback />}>
            <FilterSidebar basePath={basePath} facets={result.facets} categories={categories} />
          </Suspense>
        </div>

        <div className="min-w-0 flex-1 lg:pl-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {categories ? (
              <div role="list" aria-label="Browse by category" className="flex min-w-0 flex-wrap items-center gap-2">
                <ScopeChip href={scopeHref(undefined)} active={!activeSlug} count={allCount}>
                  All
                </ScopeChip>
                {categories.map((cat) => (
                  <ScopeChip key={cat.id} href={scopeHref(cat.slug)} active={activeSlug === cat.slug} count={cat.productCount}>
                    {cat.name}
                  </ScopeChip>
                ))}
              </div>
            ) : (
              <span className="text-[14px] text-ink-3">
                {result.meta.totalPages > 1 ? `Page ${result.meta.page} of ${result.meta.totalPages}` : ''}
              </span>
            )}
            <Suspense fallback={null}>
              <SortSelect basePath={basePath} current={result.query.sort} className="hidden lg:flex" />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <ActiveFilterChips basePath={basePath} categories={categories} hideCategory={isCategoryPage} className="mt-4" />
          </Suspense>

          <Suspense fallback={null}>
            <MobileFilterDrawer
              basePath={basePath}
              facets={result.facets}
              categories={categories}
              resultCount={total}
              className="lg:hidden"
            />
          </Suspense>

          {result.data.length === 0 ? (
            <div className="mt-6 flex flex-col items-center border border-line px-6 py-14 text-center">
              <SearchGlyph />
              <h2 className="mt-4 text-[18px] font-bold text-ink">{empty.title}</h2>
              <p className="mt-1.5 max-w-md text-[14px] text-ink-3">{empty.description}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {empty.showClear && (
                  <Link href={clearFiltersHref} className={PRIMARY_LINK}>
                    Clear filters
                  </Link>
                )}
                <Link href={empty.browseHref} className={SECONDARY_LINK}>
                  {empty.browseLabel}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              {result.data.map((product) => (
                <div key={product.id} className="relative z-0 hover:z-10 focus-within:z-10">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          <Pagination meta={result.meta} basePath={basePath} searchParams={searchParams} />
        </div>
      </div>
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink-4" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35M8 11h6" strokeLinecap="round" />
    </svg>
  );
}

function StatePanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <SearchGlyph />
      <h1 className="mt-4 text-[20px] font-bold text-ink">{title}</h1>
      <p className="mt-2 max-w-md text-[14px] text-ink-3">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/products" className={PRIMARY_LINK}>
          Shop all products
        </Link>
        <Link href="/" className={SECONDARY_LINK}>
          Back to home
        </Link>
      </div>
    </div>
  );
}

function ListingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading products">
      <div className="mb-6 aspect-[16/7] w-full animate-pulse rounded-sm bg-surface sm:aspect-[21/6]" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
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

function ScopeChip({ href, active, count, children }: { href: string; active: boolean; count?: number; children: ReactNode }) {
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
