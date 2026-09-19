'use client';

import type { CategorySummary, ProductFacets } from '@/lib/types';
import FilterPanel from './FilterPanel';
import { EMPTY_FILTER_VALUES, countActiveFilters, pickFilterValues, type FilterValues } from './catalogParams';
import { useCatalogParams } from './useCatalogParams';

export interface FilterSidebarProps {
  basePath: string;
  facets: ProductFacets;
  categories?: CategorySummary[];
  className?: string;
}

export default function FilterSidebar({ basePath, facets, categories, className = '' }: FilterSidebarProps) {
  const { filters, update, isPending } = useCatalogParams(basePath);
  const values = pickFilterValues(filters);
  const activeCount = countActiveFilters(values, { includeCategory: !!categories });

  const clear = () => update({ ...EMPTY_FILTER_VALUES, category: categories ? undefined : filters.category });

  return (
    <aside
      aria-label="Filters"
      aria-busy={isPending || undefined}
      className={`bg-white pr-5 transition-opacity duration-200 ${isPending ? 'opacity-60' : ''} ${className}`}
    >
      <div className="mb-4 flex h-8 items-center justify-between border-b border-line pb-3">
        <h2 className="text-[16px] font-bold uppercase tracking-wide text-ink">Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clear}
            className="rounded-sm text-[13px] font-bold uppercase tracking-wide text-brand transition-colors hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Clear all
            <span className="sr-only"> ({activeCount} active)</span>
          </button>
        )}
      </div>
      <FilterPanel
        facets={facets}
        categories={categories}
        values={values}
        onChange={(next: FilterValues) => update(next)}
        idPrefix="sidebar"
      />
    </aside>
  );
}
