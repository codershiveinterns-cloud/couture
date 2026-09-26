'use client';

import type { ProductQuery } from '@/lib/api';
import type { CategorySummary, ProductSummary } from '@/lib/types';
import CategoryGrid from '@/components/home/CategoryGrid';
import DealsRail from '@/components/home/DealsRail';
import ProductRail from '@/components/home/ProductRail';
import TrendingBrands from '@/components/home/TrendingBrands';
import { useLiveCategories, useLiveProducts } from './useLiveCatalog';

// Home sections that follow the effective (admin-edited) catalog: edited names,
// prices and stock show up, unpublished/deleted products drop out.

interface LiveProductsProps {
  /** Server-rendered products (base catalog). */
  products: ProductSummary[];
  /** The same query the server used, re-run client-side when the catalog has overrides. */
  query: ProductQuery;
}

export function LiveCategoryGrid({ categories }: { categories: CategorySummary[] }) {
  return <CategoryGrid categories={useLiveCategories(categories)} />;
}

export function LiveDealsRail({ products, query, href }: LiveProductsProps & { href?: string }) {
  return <DealsRail products={useLiveProducts(products, query)} href={href} />;
}

export function LiveTrendingBrands({ products, query }: LiveProductsProps) {
  return <TrendingBrands products={useLiveProducts(products, query)} />;
}

export function LiveProductRail({
  products,
  query,
  title,
  href,
  layout,
}: LiveProductsProps & { title: string; href?: string; layout?: 'rail' | 'grid' }) {
  return <ProductRail title={title} href={href} products={useLiveProducts(products, query)} layout={layout} />;
}
