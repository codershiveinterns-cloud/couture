'use client';

import type { CategorySummary } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { EMPTY_FILTER_VALUES, type CatalogFilters } from './catalogParams';
import { useCatalogParams } from './useCatalogParams';

export interface ActiveFilterChipsProps {
  basePath: string;
  categories?: CategorySummary[];
  /** Set on category pages, where the route already scopes the category. */
  hideCategory?: boolean;
  className?: string;
}

interface Chip {
  key: string;
  label: string;
  next: Partial<CatalogFilters>;
}

export default function ActiveFilterChips({ basePath, categories, hideCategory = false, className = '' }: ActiveFilterChipsProps) {
  const { filters, update } = useCatalogParams(basePath);
  const chips: Chip[] = [];

  if (filters.q) chips.push({ key: 'q', label: `Search: “${filters.q}”`, next: { q: undefined } });
  if (filters.featured) chips.push({ key: 'featured', label: 'Featured', next: { featured: false } });
  if (!hideCategory && filters.category) {
    const name = categories?.find((c) => c.slug === filters.category)?.name ?? filters.category;
    chips.push({ key: 'category', label: name, next: { category: undefined } });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const from = filters.minPrice !== undefined ? formatPrice(filters.minPrice) : null;
    const to = filters.maxPrice !== undefined ? formatPrice(filters.maxPrice) : null;
    const label = from && to ? `${from} – ${to}` : from ? `From ${from}` : `Up to ${to}`;
    chips.push({ key: 'price', label, next: { minPrice: undefined, maxPrice: undefined } });
  }
  for (const brand of filters.brands) {
    chips.push({ key: `brand-${brand}`, label: brand, next: { brands: filters.brands.filter((b) => b !== brand) } });
  }
  if (filters.minRating !== undefined) {
    chips.push({ key: 'rating', label: `${filters.minRating}★ & above`, next: { minRating: undefined } });
  }
  if (filters.inStock) chips.push({ key: 'inStock', label: 'In stock', next: { inStock: false } });
  for (const color of filters.colors) {
    chips.push({ key: `color-${color}`, label: `Color: ${color}`, next: { colors: filters.colors.filter((c) => c !== color) } });
  }
  for (const size of filters.sizes) {
    chips.push({ key: `size-${size}`, label: `Size: ${size}`, next: { sizes: filters.sizes.filter((s) => s !== size) } });
  }

  if (chips.length === 0) return null;

  const clearAll = () =>
    update({
      ...EMPTY_FILTER_VALUES,
      q: undefined,
      featured: false,
      category: hideCategory ? filters.category : undefined,
    });

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => update(chip.next)}
          className="group inline-flex h-8 items-center gap-1.5 rounded-sm border border-line-strong bg-white pl-2.5 pr-2 text-[12px] font-bold text-ink transition-colors duration-150 hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {chip.label}
          <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center text-ink-3 transition-colors group-hover:text-ink">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </span>
          <span className="sr-only">Remove filter {chip.label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="h-8 rounded-sm px-2 text-[12px] font-bold uppercase tracking-wide text-brand transition-colors hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        Clear all
      </button>
    </div>
  );
}
