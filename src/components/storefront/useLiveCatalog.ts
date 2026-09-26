'use client';

import { useMemo } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { listCategories, queryProducts, type ProductQuery } from '@/lib/api';
import type { CategorySummary, ProductSummary } from '@/lib/types';

/**
 * True once the browser catalog (admin edits, stock movements) differs from the
 * server-rendered base catalog. Always false during SSR + the hydration render,
 * so the first client render equals the server HTML.
 */
export function useLiveCatalog() {
  const catalog = useCatalog();
  return { ...catalog, isLive: catalog.isHydrated && catalog.hasOverrides };
}

/** Server-rendered product list, recomputed from the effective catalog when it has overrides. */
export function useLiveProducts(serverProducts: ProductSummary[], query: ProductQuery): ProductSummary[] {
  const { isLive, publishedProducts, categories } = useLiveCatalog();
  const key = JSON.stringify(query);
  return useMemo(
    () => (isLive ? queryProducts(publishedProducts, categories, JSON.parse(key) as ProductQuery).data : serverProducts),
    [isLive, publishedProducts, categories, key, serverProducts],
  );
}

/** Server-rendered categories, replaced by the effective categories when the catalog has overrides. */
export function useLiveCategories(serverCategories: CategorySummary[]): CategorySummary[] {
  const { isLive, categories } = useLiveCatalog();
  return useMemo(() => (isLive ? listCategories(categories) : serverCategories), [isLive, categories, serverCategories]);
}
