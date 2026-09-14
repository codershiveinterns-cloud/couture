export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount?: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  category?: { id: string; name: string; slug: string };
  image: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  priceDelta: number;
  stock: number;
  isActive: boolean;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  brand: string | null;
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  category?: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta?: PaginationMeta;
}

export interface ApiItemResponse<T> {
  success: boolean;
  data: T;
}
