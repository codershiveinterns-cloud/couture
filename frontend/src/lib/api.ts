import type {
  ApiItemResponse,
  ApiListResponse,
  CategorySummary,
  ProductDetail,
  ProductSummary,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new ApiRequestError(res.status, `Request to ${path} failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function getCategories(): Promise<CategorySummary[]> {
  const res = await apiFetch<ApiListResponse<CategorySummary>>('/categories');
  return res.data;
}

export async function getCategoryBySlug(slug: string): Promise<CategorySummary | null> {
  try {
    const res = await apiFetch<ApiItemResponse<CategorySummary>>(`/categories/${slug}`);
    return res.data;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  featured?: boolean;
  q?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popularity';
}

export async function getProducts(query: ProductQuery = {}): Promise<ApiListResponse<ProductSummary>> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.category) params.set('category', query.category);
  if (query.featured) params.set('featured', 'true');
  if (query.q) params.set('q', query.q);
  if (query.sort) params.set('sort', query.sort);

  const qs = params.toString();
  return apiFetch<ApiListResponse<ProductSummary>>(`/products${qs ? `?${qs}` : ''}`);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await apiFetch<ApiItemResponse<ProductDetail>>(`/products/${slug}`);
    return res.data;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}

export async function getRelatedProducts(slug: string): Promise<ProductSummary[]> {
  const res = await apiFetch<ApiListResponse<ProductSummary>>(`/products/${slug}/related`);
  return res.data;
}
