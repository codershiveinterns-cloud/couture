// Shape of the raw records in mockData.ts (source-of-truth "database" rows,
// before being reshaped into the API-response types in lib/types.ts).

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
}

export interface ProductImageRecord {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface ProductVariantRecord {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  priceDelta: number;
  stock: number;
  isActive: boolean;
}

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  brand: string;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  images: ProductImageRecord[];
  variants: ProductVariantRecord[];
  createdAt: string;
}
