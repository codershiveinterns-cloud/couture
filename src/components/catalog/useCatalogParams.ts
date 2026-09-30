'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';
import { useCatalog } from '@/hooks/useCatalog';
import { applyFiltersToParams, parseCatalogFilters, type CatalogFilters } from './catalogParams';

export interface CatalogParamsApi {
  filters: CatalogFilters;
  isPending: boolean;
  hrefFor(next: CatalogFilters): string;
  /** Navigates with the patch applied; page resets to 1 unless the patch sets it. */
  update(patch: Partial<CatalogFilters>): void;
  replaceAll(next: CatalogFilters): void;
}

export function useCatalogParams(basePath: string): CatalogParamsApi {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // Effective catalog (base during SSR/hydration, admin overrides after): admin-created
  // category slugs in the URL survive parsing instead of being silently dropped.
  const { categories } = useCatalog();

  const filters = useMemo(() => parseCatalogFilters(searchParams, categories), [searchParams, categories]);

  const hrefFor = useCallback(
    (next: CatalogFilters) => {
      const qs = applyFiltersToParams(searchParams, next).toString();
      return qs ? `${basePath}?${qs}` : basePath;
    },
    [basePath, searchParams],
  );

  const replaceAll = useCallback(
    (next: CatalogFilters) => {
      startTransition(() => {
        router.push(hrefFor(next), { scroll: false });
      });
    },
    [hrefFor, router],
  );

  const update = useCallback(
    (patch: Partial<CatalogFilters>) => replaceAll({ ...filters, page: 1, ...patch }),
    [filters, replaceAll],
  );

  return { filters, isPending, hrefFor, update, replaceAll };
}
