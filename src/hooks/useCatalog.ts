import { useMemo, useSyncExternalStore } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import type { CategoryRecord, ProductRecord } from '@/lib/mockTypes';
import {
  getCatalog,
  getServerCatalog,
  lookupProduct,
  publishedProductsOf,
  subscribeCatalog,
} from '@/lib/services/catalogStore';

export interface UseCatalogResult {
  /** Effective catalog: every product, drafts included, newest first (status always set). */
  products: readonly ProductRecord[];
  /** Published products only (what the storefront may show). */
  publishedProducts: readonly ProductRecord[];
  /** Sorted by sortOrder; productCount = published products. */
  categories: readonly CategoryRecord[];
  /** false during SSR/hydration: the base catalog is returned until then. */
  isHydrated: boolean;
  /** true once the admin has changed anything (edits, new/deleted items, stock movements from orders). */
  hasOverrides: boolean;
  /** Includes drafts. */
  getProduct(id: string | null | undefined): ProductRecord | undefined;
}

export function useCatalog(): UseCatalogResult {
  const snapshot = useSyncExternalStore(subscribeCatalog, getCatalog, getServerCatalog);
  const isHydrated = useHydrated();
  return useMemo(
    () => ({
      products: snapshot.products,
      publishedProducts: publishedProductsOf(snapshot),
      categories: snapshot.categories,
      isHydrated,
      hasOverrides: snapshot !== getServerCatalog(),
      getProduct: (id) => lookupProduct(snapshot, id, true),
    }),
    [snapshot, isHydrated],
  );
}

/** One product by id from the effective catalog (drafts included); undefined when missing/deleted. */
export function useCatalogProduct(id: string | null | undefined): ProductRecord | undefined {
  const { getProduct } = useCatalog();
  return getProduct(id);
}
