// Data layer for the storefront. Currently backed by a static in-memory
// catalog (see mockData.ts) so the app runs with zero external
// dependencies — no database, no separate API service, nothing to
// configure on deploy. Swap these functions for real network calls (or a
// direct Prisma-backed data layer) once a production database is wired up;
// every caller only depends on the return shapes below, not on how they're
// produced.

import type {
  ApiListResponse,
  CategorySummary,
  ProductDetail,
  ProductSummary,
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
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popularity';
}

const SORTERS: Record<NonNullable<ProductQuery['sort']>, (a: ProductRecord, b: ProductRecord) => number> = {
  newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  rating: (a, b) => b.avgRating - a.avgRating,
  popularity: (a, b) => b.reviewCount - a.reviewCount,
};

export async function getProducts(query: ProductQuery = {}): Promise<ApiListResponse<ProductSummary>> {
  await simulateLatency();

  let items = [...MOCK_PRODUCTS];

  if (query.category) {
    items = items.filter((p) => p.categorySlug === query.category);
  }
  if (query.featured) {
    items = items.filter((p) => p.isFeatured);
  }
  if (query.q && query.q.trim()) {
    const needle = query.q.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle) ||
        p.brand.toLowerCase().includes(needle),
    );
  }

  items.sort(SORTERS[query.sort || 'newest']);

  const page = Math.max(query.page || 1, 1);
  const pageSize = Math.min(Math.max(query.pageSize || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const total = items.length;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    success: true,
    data: pageItems.map(toProductSummary),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
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
