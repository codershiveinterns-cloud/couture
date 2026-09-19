'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CategorySummary, ProductFacets } from '@/lib/types';
import { isProductSort } from '@/lib/api';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import FilterPanel from './FilterPanel';
import { EMPTY_FILTER_VALUES, SORT_OPTIONS, countActiveFilters, pickFilterValues, type FilterValues } from './catalogParams';
import { useCatalogParams } from './useCatalogParams';

export interface MobileFilterDrawerProps {
  basePath: string;
  facets: ProductFacets;
  categories?: CategorySummary[];
  resultCount: number;
  className?: string;
}

/**
 * Myntra-style mobile bottom bar: "SORT | FILTER". SORT is a native select
 * (URL-synced through useCatalogParams); FILTER opens the drawer.
 */
export default function MobileFilterDrawer({ basePath, facets, categories, resultCount, className = '' }: MobileFilterDrawerProps) {
  const { filters, update } = useCatalogParams(basePath);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const values = pickFilterValues(filters);
  const activeCount = countActiveFilters(values, { includeCategory: !!categories });
  const sortId = useId();

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-line bg-white shadow-[0_-2px_8px_rgba(40,44,63,0.08)] ${className}`}
      >
        <label
          htmlFor={sortId}
          className="relative flex h-12 cursor-pointer items-center justify-center gap-2 border-r border-line text-[13px] font-bold uppercase tracking-wide text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
          </svg>
          Sort
          <select
            id={sortId}
            aria-label="Sort by"
            value={filters.sort}
            onChange={(e) => {
              if (isProductSort(e.target.value)) update({ sort: e.target.value });
            }}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 focus-visible:opacity-100 focus-visible:bg-white focus-visible:px-4 focus-visible:text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex h-12 items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-wide text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" strokeLinejoin="round" />
          </svg>
          Filter
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {open && (
        <Drawer
          facets={facets}
          categories={categories}
          initialValues={values}
          resultCount={resultCount}
          lockedCategory={categories ? undefined : filters.category}
          onClose={close}
          onApply={(next) => {
            update(next);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function Drawer({
  facets,
  categories,
  initialValues,
  resultCount,
  lockedCategory,
  onClose,
  onApply,
}: {
  facets: ProductFacets;
  categories?: CategorySummary[];
  initialValues: FilterValues;
  resultCount: number;
  lockedCategory?: string;
  onClose(): void;
  onApply(next: FilterValues): void;
}) {
  const [draft, setDraft] = useState<FilterValues>(initialValues);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useBodyScrollLock(true);
  useOnClickOutside(panelRef, onClose);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const draftCount = countActiveFilters(draft, { includeCategory: !!categories });

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-ink/50 animate-fade-in" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-[0_4px_12px_rgba(40,44,63,0.15)] animate-fade-in"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <h2 id={titleId} className="text-[16px] font-bold uppercase tracking-wide text-ink">
            Filters
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-9 w-9 items-center justify-center rounded-sm text-ink-2 transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <FilterPanel facets={facets} categories={categories} values={draft} onChange={setDraft} idPrefix="drawer" />
        </div>

        <div className="flex items-center gap-3 border-t border-line bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => setDraft({ ...EMPTY_FILTER_VALUES, category: lockedCategory })}
            disabled={draftCount === 0}
            className="h-11 flex-1 rounded-sm border border-line-strong bg-white text-[13px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:border-line disabled:text-ink-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="h-11 flex-1 rounded-sm bg-brand text-[13px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Apply
            <span className="sr-only"> filters</span>
            <span className="ml-1 font-normal text-white/80">({resultCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
