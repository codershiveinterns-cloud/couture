import { DEFAULT_SORT, isProductSort, parseProductQuery, type ProductQuery } from '@/lib/api';
import type { ProductSort } from '@/lib/types';

export interface FilterValues {
  category?: string;
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock: boolean;
  colors: string[];
  sizes: string[];
}

export interface CatalogFilters extends FilterValues {
  q?: string;
  featured: boolean;
  sort: ProductSort;
  page: number;
}

export const FILTER_PARAM_KEYS = [
  'q',
  'category',
  'featured',
  'brands',
  'minPrice',
  'maxPrice',
  'minRating',
  'inStock',
  'colors',
  'sizes',
  'sort',
  'page',
] as const;

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: "What's New" },
  { value: 'popularity', label: 'Popularity' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer Rating' },
];

export const RATING_OPTIONS = [4, 3, 2, 1] as const;

export const EMPTY_FILTER_VALUES: FilterValues = { brands: [], inStock: false, colors: [], sizes: [] };

export function toCatalogFilters(query: ProductQuery): CatalogFilters {
  return {
    q: query.q,
    category: query.category,
    featured: query.featured === true,
    brands: query.brands ?? [],
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    minRating: query.minRating,
    inStock: query.inStock === true,
    colors: query.colors ?? [],
    sizes: query.sizes ?? [],
    sort: isProductSort(query.sort) ? query.sort : DEFAULT_SORT,
    page: query.page ?? 1,
  };
}

export function parseCatalogFilters(raw: URLSearchParams | Record<string, string | string[] | undefined>): CatalogFilters {
  return toCatalogFilters(parseProductQuery(raw));
}

export function pickFilterValues(filters: CatalogFilters): FilterValues {
  return {
    category: filters.category,
    brands: filters.brands,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minRating: filters.minRating,
    inStock: filters.inStock,
    colors: filters.colors,
    sizes: filters.sizes,
  };
}

export function countActiveFilters(values: FilterValues, { includeCategory = true } = {}): number {
  let n = values.brands.length + values.colors.length + values.sizes.length;
  if (includeCategory && values.category) n += 1;
  if (values.minPrice !== undefined || values.maxPrice !== undefined) n += 1;
  if (values.minRating !== undefined) n += 1;
  if (values.inStock) n += 1;
  return n;
}

/** Serialises filters onto `base` (unknown params in `base` are preserved). */
export function applyFiltersToParams(base: URLSearchParams, filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams(base);
  for (const key of FILTER_PARAM_KEYS) params.delete(key);

  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.featured) params.set('featured', 'true');
  if (filters.brands.length) params.set('brands', filters.brands.join(','));
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minRating !== undefined) params.set('minRating', String(filters.minRating));
  if (filters.inStock) params.set('inStock', 'true');
  if (filters.colors.length) params.set('colors', filters.colors.join(','));
  if (filters.sizes.length) params.set('sizes', filters.sizes.join(','));
  if (filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function buildCatalogHref(basePath: string, filters: CatalogFilters, base?: URLSearchParams): string {
  const qs = applyFiltersToParams(base ?? new URLSearchParams(), filters).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function toggleValue(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function slugifyId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
