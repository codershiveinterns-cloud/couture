// Data layer for the storefront. Currently backed by a static in-memory
// catalog (see mockData.ts) so the app runs with zero external
// dependencies — no database, no separate API service, nothing to
// configure on deploy. Swap these functions for real network calls (or a
// direct Prisma-backed data layer) once a production database is wired up;
// every caller only depends on the return shapes below, not on how they're
// produced.

import type {
  CategorySummary,
  FacetOption,
  ProductDetail,
  ProductFacets,
  ProductSearchResult,
  ProductSort,
  ProductSummary,
  ResolvedProductQuery,
} from './types';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from './mockData';
import type { ProductRecord } from './mockTypes';

const MAX_PAGE_SIZE = 48;
const DEFAULT_PAGE_SIZE = 12;

// Small artificial delay so navigation/loading states are visible in the
// demo instead of resolving instantly — remove once this is a real fetch.
const simulateLatency = () => new Promise((resolve) => setTimeout(resolve, 120));

function toCategorySummary(cat: (typeof MOCK_CATEGORIES)[number]): CategorySummary {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    productCount: cat.productCount,
  };
}

function toProductSummary(p: ProductRecord): ProductSummary {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    isFeatured: p.isFeatured,
    brand: p.brand,
    category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug },
    image: p.images[0]?.url ?? null,
    hoverImage: p.images[1]?.url ?? null,
  };
}

function toProductDetail(p: ProductRecord): ProductDetail {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    shortDescription: p.shortDescription,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    brand: p.brand,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    isFeatured: p.isFeatured,
    category: { id: p.categoryId, name: p.categoryName, slug: p.categorySlug },
    images: p.images,
    variants: p.variants,
    createdAt: p.createdAt,
  };
}

export async function getCategories(): Promise<CategorySummary[]> {
  await simulateLatency();
  return [...MOCK_CATEGORIES]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toCategorySummary);
}

export async function getCategoryBySlug(slug: string): Promise<CategorySummary | null> {
  await simulateLatency();
  const cat = MOCK_CATEGORIES.find((c) => c.slug === slug);
  return cat ? toCategorySummary(cat) : null;
}

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  featured?: boolean;
  q?: string;
  sort?: ProductSort;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  colors?: string[];
  sizes?: string[];
}

export const PRODUCT_SORTS: readonly ProductSort[] = ['newest', 'price_asc', 'price_desc', 'rating', 'popularity'];
export const DEFAULT_SORT: ProductSort = 'newest';
export const MAX_QUERY_LENGTH = 100;
export const MAX_LIST_VALUES = 20;

const SORTERS: Record<ProductSort, (a: ProductRecord, b: ProductRecord) => number> = {
  newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  rating: (a, b) => b.avgRating - a.avgRating,
  popularity: (a, b) => b.reviewCount - a.reviewCount,
};

export function isProductSort(value: unknown): value is ProductSort {
  return typeof value === 'string' && PRODUCT_SORTS.includes(value as ProductSort);
}

export function tokenizeQuery(q: string | null | undefined): string[] {
  if (typeof q !== 'string') return [];
  return q.trim().slice(0, MAX_QUERY_LENGTH).toLowerCase().split(/\s+/).filter(Boolean);
}

export function productMatchesTerms(p: ProductRecord, terms: readonly string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = [p.name, p.sku, p.brand, p.categoryName, p.shortDescription, p.description]
    .join(' \n ')
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function productIsInStock(p: ProductRecord): boolean {
  return p.stock > 0 || p.variants.some((v) => v.isActive && v.stock > 0);
}

function variantValues(p: ProductRecord, key: string): string[] {
  const values: string[] = [];
  for (const v of p.variants) {
    const value = v.isActive ? v.attributes[key] : undefined;
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}

function hasAnyValue(values: readonly string[], wanted: readonly string[]): boolean {
  const lowered = values.map((v) => v.toLowerCase());
  return wanted.some((w) => lowered.includes(w.toLowerCase()));
}

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function firstValue(raw: RawParams, key: string): string | undefined {
  if (raw instanceof URLSearchParams) return raw.get(key) ?? undefined;
  if (!Object.prototype.hasOwnProperty.call(raw, key)) return undefined;
  const value = raw[key];
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' ? value : undefined;
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  const out: string[] = [];
  for (const part of value.split(',')) {
    const trimmed = part.trim().slice(0, 60);
    if (trimmed && !out.includes(trimmed)) out.push(trimmed);
    if (out.length >= MAX_LIST_VALUES) break;
  }
  return out;
}

function parseMoney(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100) / 100;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return undefined;
  return n;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  const v = value.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
  return undefined;
}

/** Turns raw URL params (page searchParams or URLSearchParams) into a ProductQuery, dropping anything invalid. */
export function parseProductQuery(raw: RawParams): ProductQuery {
  const query: ProductQuery = {};
  const q = firstValue(raw, 'q');
  if (q && q.trim()) query.q = q.trim().slice(0, MAX_QUERY_LENGTH);

  const category = firstValue(raw, 'category');
  if (category && MOCK_CATEGORIES.some((c) => c.slug === category)) query.category = category;

  if (parseBoolean(firstValue(raw, 'featured'))) query.featured = true;
  if (parseBoolean(firstValue(raw, 'inStock'))) query.inStock = true;

  const sort = firstValue(raw, 'sort');
  if (isProductSort(sort)) query.sort = sort;

  const brands = parseList(firstValue(raw, 'brands'));
  if (brands.length) query.brands = brands;
  const colors = parseList(firstValue(raw, 'colors'));
  if (colors.length) query.colors = colors;
  const sizes = parseList(firstValue(raw, 'sizes'));
  if (sizes.length) query.sizes = sizes;

  const minPrice = parseMoney(firstValue(raw, 'minPrice'));
  if (minPrice !== undefined) query.minPrice = minPrice;
  const maxPrice = parseMoney(firstValue(raw, 'maxPrice'));
  if (maxPrice !== undefined) query.maxPrice = maxPrice;

  const minRating = parsePositiveInt(firstValue(raw, 'minRating'));
  if (minRating !== undefined && minRating <= 4) query.minRating = minRating;

  const page = parsePositiveInt(firstValue(raw, 'page'));
  if (page !== undefined) query.page = page;
  const pageSize = parsePositiveInt(firstValue(raw, 'pageSize'));
  if (pageSize !== undefined) query.pageSize = pageSize;

  return query;
}

function cleanList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return parseList(values.filter((v): v is string => typeof v === 'string').join(','));
}

function cleanNumber(value: unknown, min = 0): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= min ? value : null;
}

function resolveQuery(query: ProductQuery): ResolvedProductQuery {
  const category = typeof query.category === 'string' && MOCK_CATEGORIES.some((c) => c.slug === query.category)
    ? query.category
    : null;
  const minRatingRaw = cleanNumber(query.minRating, 1);
  const minRating = minRatingRaw !== null && Number.isInteger(minRatingRaw) && minRatingRaw <= 4 ? minRatingRaw : null;
  const pageRaw = cleanNumber(query.page, 1);
  const pageSizeRaw = cleanNumber(query.pageSize, 1);
  return {
    q: typeof query.q === 'string' ? query.q.trim().slice(0, MAX_QUERY_LENGTH) : '',
    category,
    featured: query.featured === true,
    brands: cleanList(query.brands),
    minPrice: cleanNumber(query.minPrice),
    maxPrice: cleanNumber(query.maxPrice),
    minRating,
    inStock: query.inStock === true,
    colors: cleanList(query.colors),
    sizes: cleanList(query.sizes),
    sort: isProductSort(query.sort) ? query.sort : DEFAULT_SORT,
    page: pageRaw !== null ? Math.floor(pageRaw) : 1,
    pageSize: pageSizeRaw !== null ? Math.min(Math.floor(pageSizeRaw), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
  };
}

function countValues(items: readonly ProductRecord[], pick: (p: ProductRecord) => string[]): FacetOption[] {
  const counts = new Map<string, number>();
  for (const p of items) {
    for (const value of pick(p)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function computeFacets(scope: readonly ProductRecord[]): ProductFacets {
  const prices = scope.map((p) => p.price);
  const sizes = countValues(scope, (p) => variantValues(p, 'size')).sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.value.toUpperCase());
    const bi = SIZE_ORDER.indexOf(b.value.toUpperCase());
    if (ai === -1 && bi === -1) return a.value.localeCompare(b.value);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return {
    brands: countValues(scope, (p) => (p.brand ? [p.brand] : [])),
    colors: countValues(scope, (p) => variantValues(p, 'color')),
    sizes,
    priceMin: prices.length ? Math.floor(Math.min(...prices)) : 0,
    priceMax: prices.length ? Math.ceil(Math.max(...prices)) : 0,
    inStockCount: scope.filter(productIsInStock).length,
    total: scope.length,
  };
}

export async function getProducts(query: ProductQuery = {}): Promise<ProductSearchResult> {
  await simulateLatency();

  const resolved = resolveQuery(query ?? {});
  const terms = tokenizeQuery(resolved.q);

  // Facets are computed over the search + category scope only, so selecting a
  // brand or colour does not make the other options disappear.
  const scope = MOCK_PRODUCTS.filter(
    (p) =>
      (!resolved.category || p.categorySlug === resolved.category) &&
      (!resolved.featured || p.isFeatured) &&
      productMatchesTerms(p, terms),
  );

  let items = scope;
  if (resolved.brands.length) items = items.filter((p) => hasAnyValue([p.brand], resolved.brands));
  if (resolved.minPrice !== null) items = items.filter((p) => p.price >= (resolved.minPrice as number));
  if (resolved.maxPrice !== null) items = items.filter((p) => p.price <= (resolved.maxPrice as number));
  if (resolved.minRating !== null) items = items.filter((p) => p.avgRating >= (resolved.minRating as number));
  if (resolved.inStock) items = items.filter(productIsInStock);
  if (resolved.colors.length) items = items.filter((p) => hasAnyValue(variantValues(p, 'color'), resolved.colors));
  if (resolved.sizes.length) items = items.filter((p) => hasAnyValue(variantValues(p, 'size'), resolved.sizes));

  items = [...items].sort(SORTERS[resolved.sort]);

  const total = items.length;
  const pageSize = resolved.pageSize;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(resolved.page, totalPages);
  const start = (page - 1) * pageSize;

  return {
    success: true,
    data: items.slice(start, start + pageSize).map(toProductSummary),
    meta: { page, pageSize, total, totalPages },
    facets: computeFacets(scope),
    query: { ...resolved, page, pageSize },
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  await simulateLatency();
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
  return product ? toProductDetail(product) : null;
}

export async function getRelatedProducts(slug: string): Promise<ProductSummary[]> {
  await simulateLatency();
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return [];

  return MOCK_PRODUCTS.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4)
    .map(toProductSummary);
}
