// Effective catalog = static base data (mockData.ts) + admin overrides persisted in localStorage.
//
//   catalog:products           Record<productId, ProductRecord>   edited base products + admin-created products
//   catalog:deletedProducts    string[]                           ids of deleted BASE products
//   catalog:categories         Record<categoryId, CategoryRecord>
//   catalog:deletedCategories  string[]
//
// This module is the swap point for a real catalog API: every function below maps 1:1 to a
// REST call (GET /admin/catalog, POST /admin/products, PATCH /admin/products/:id/stock, ...).
// On the server (no localStorage) the effective catalog is exactly the base catalog.

import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../mockData';
import type {
  CategoryRecord,
  ProductImageRecord,
  ProductRecord,
  ProductStatus,
  ProductVariantRecord,
} from '../mockTypes';
import { roundMoney } from '../pricing';
import { getJsonStore, isRecord, storageKeys, subscribeKeys } from '../storage';
import { hasErrors, type FieldErrors } from '../validation';
import { randomId } from './crypto';
import type { ServiceResult } from './types';

export const LOW_STOCK_THRESHOLD = 5;
export const ALLOWED_IMAGE_HOST = 'images.unsplash.com';
export const IMAGE_URL_HINT = `Image URLs must start with https://${ALLOWED_IMAGE_HOST}/`;
export const PRODUCT_NAME_MAX = 120;
export const CATALOG_FORM_ERROR = 'Please fix the highlighted fields';

export interface CatalogSnapshot {
  /** Every product, drafts included, newest first. `status` is always set. */
  products: readonly ProductRecord[];
  /** Sorted by sortOrder. `productCount` = published products in the category. */
  categories: readonly CategoryRecord[];
}

type ProductMap = Record<string, ProductRecord>;
type CategoryMap = Record<string, CategoryRecord>;

const EMPTY_PRODUCT_MAP: ProductMap = {};
const EMPTY_CATEGORY_MAP: CategoryMap = {};
const EMPTY_IDS: string[] = [];

function isImageRecord(value: unknown): value is ProductImageRecord {
  return isRecord(value) && typeof value.id === 'string' && typeof value.url === 'string';
}

function isVariantRecord(value: unknown): value is ProductVariantRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.sku === 'string' &&
    typeof value.priceDelta === 'number' &&
    typeof value.stock === 'number' &&
    isRecord(value.attributes)
  );
}

function isProductRecord(value: unknown): value is ProductRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.sku === 'string' &&
    typeof value.price === 'number' &&
    typeof value.stock === 'number' &&
    typeof value.categoryId === 'string' &&
    Array.isArray(value.images) &&
    value.images.every(isImageRecord) &&
    Array.isArray(value.variants) &&
    value.variants.every(isVariantRecord) &&
    typeof value.createdAt === 'string'
  );
}

function isCategoryRecord(value: unknown): value is CategoryRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.sortOrder === 'number'
  );
}

function sanitizeMap<T extends { id: string }>(value: unknown, isItem: (v: unknown) => v is T): Record<string, T> {
  if (!isRecord(value)) return {};
  const out: Record<string, T> = {};
  Object.entries(value).forEach(([id, item]) => {
    if (isItem(item) && item.id === id) out[id] = item;
  });
  return out;
}

const sanitizeIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

const productOverridesStore = () =>
  getJsonStore<ProductMap>(storageKeys.catalogProducts, EMPTY_PRODUCT_MAP, (v) => sanitizeMap(v, isProductRecord));
const deletedProductsStore = () => getJsonStore(storageKeys.catalogDeletedProducts, EMPTY_IDS, sanitizeIds);
const categoryOverridesStore = () =>
  getJsonStore<CategoryMap>(storageKeys.catalogCategories, EMPTY_CATEGORY_MAP, (v) => sanitizeMap(v, isCategoryRecord));
const deletedCategoriesStore = () => getJsonStore(storageKeys.catalogDeletedCategories, EMPTY_IDS, sanitizeIds);

export function productStatus(product: Pick<ProductRecord, 'status'>): ProductStatus {
  return product.status === 'draft' ? 'draft' : 'published';
}

export function isProductPublished(product: Pick<ProductRecord, 'status'>): boolean {
  return productStatus(product) === 'published';
}

const byNewest = (a: ProductRecord, b: ProductRecord) =>
  a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;

function normalizeProduct(product: ProductRecord, categories: ReadonlyMap<string, CategoryRecord>): ProductRecord {
  const category = categories.get(product.categoryId);
  const status = productStatus(product);
  const categorySlug = category?.slug ?? product.categorySlug ?? '';
  const categoryName = category?.name ?? product.categoryName ?? '';
  if (product.status === status && product.categorySlug === categorySlug && product.categoryName === categoryName) {
    return product;
  }
  return { ...product, status, categorySlug, categoryName };
}

function buildSnapshot(
  productOverrides: ProductMap,
  deletedProducts: readonly string[],
  categoryOverrides: CategoryMap,
  deletedCategories: readonly string[],
): CatalogSnapshot {
  const deletedCategoryIds = new Set(deletedCategories);
  const baseCategoryIds = new Set(MOCK_CATEGORIES.map((c) => c.id));
  const categoryList: CategoryRecord[] = [
    ...MOCK_CATEGORIES.filter((c) => !deletedCategoryIds.has(c.id)).map((c) => categoryOverrides[c.id] ?? c),
    ...Object.values(categoryOverrides).filter((c) => !baseCategoryIds.has(c.id)),
  ];
  const categoriesById = new Map(categoryList.map((c) => [c.id, c]));

  const deletedProductIds = new Set(deletedProducts);
  const baseProductIds = new Set(MOCK_PRODUCTS.map((p) => p.id));
  const products = [
    ...MOCK_PRODUCTS.filter((p) => !deletedProductIds.has(p.id)).map((p) => productOverrides[p.id] ?? p),
    ...Object.values(productOverrides).filter((p) => !baseProductIds.has(p.id)),
  ]
    .map((p) => normalizeProduct(p, categoriesById))
    .sort(byNewest);

  const counts = new Map<string, number>();
  products.forEach((p) => {
    if (isProductPublished(p)) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
  });
  const categories = categoryList
    .map((c) => {
      const productCount = counts.get(c.id) ?? 0;
      return c.productCount === productCount ? c : { ...c, productCount };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return { products, categories };
}

const BASE_CATALOG: CatalogSnapshot = buildSnapshot(EMPTY_PRODUCT_MAP, EMPTY_IDS, EMPTY_CATEGORY_MAP, EMPTY_IDS);

let snapshotCache: {
  productOverrides: ProductMap;
  deletedProducts: string[];
  categoryOverrides: CategoryMap;
  deletedCategories: string[];
  snapshot: CatalogSnapshot;
} | null = null;

function isEmptyOverrides(
  productOverrides: ProductMap,
  deletedProducts: readonly string[],
  categoryOverrides: CategoryMap,
  deletedCategories: readonly string[],
): boolean {
  return (
    Object.keys(productOverrides).length === 0 &&
    deletedProducts.length === 0 &&
    Object.keys(categoryOverrides).length === 0 &&
    deletedCategories.length === 0
  );
}

/** Effective catalog (drafts included). Referentially stable until a catalog key changes: safe as a useSyncExternalStore snapshot. */
export function getCatalog(): CatalogSnapshot {
  const productOverrides = productOverridesStore().get();
  const deletedProducts = deletedProductsStore().get();
  const categoryOverrides = categoryOverridesStore().get();
  const deletedCategories = deletedCategoriesStore().get();
  if (
    snapshotCache &&
    snapshotCache.productOverrides === productOverrides &&
    snapshotCache.deletedProducts === deletedProducts &&
    snapshotCache.categoryOverrides === categoryOverrides &&
    snapshotCache.deletedCategories === deletedCategories
  ) {
    return snapshotCache.snapshot;
  }
  const snapshot = isEmptyOverrides(productOverrides, deletedProducts, categoryOverrides, deletedCategories)
    ? BASE_CATALOG
    : buildSnapshot(productOverrides, deletedProducts, categoryOverrides, deletedCategories);
  snapshotCache = { productOverrides, deletedProducts, categoryOverrides, deletedCategories, snapshot };
  return snapshot;
}

/** Server / hydration snapshot: the untouched base catalog. */
export function getServerCatalog(): CatalogSnapshot {
  return BASE_CATALOG;
}

export const getCatalogSnapshot = getCatalog;

const CATALOG_KEYS = [
  storageKeys.catalogProducts,
  storageKeys.catalogDeletedProducts,
  storageKeys.catalogCategories,
  storageKeys.catalogDeletedCategories,
] as const;

export function subscribeCatalog(callback: () => void): () => void {
  return subscribeKeys(CATALOG_KEYS, callback);
}

export function hasCatalogOverrides(): boolean {
  return getCatalog() !== BASE_CATALOG;
}

interface CatalogIndex {
  byId: Map<string, ProductRecord>;
  bySlug: Map<string, ProductRecord>;
  published: readonly ProductRecord[];
  categoriesById: Map<string, CategoryRecord>;
  categoriesBySlug: Map<string, CategoryRecord>;
}

const indexCache = new WeakMap<CatalogSnapshot, CatalogIndex>();

function indexOf(snapshot: CatalogSnapshot): CatalogIndex {
  let index = indexCache.get(snapshot);
  if (!index) {
    index = {
      byId: new Map(snapshot.products.map((p) => [p.id, p])),
      bySlug: new Map(snapshot.products.map((p) => [p.slug, p])),
      published: snapshot.products.filter(isProductPublished),
      categoriesById: new Map(snapshot.categories.map((c) => [c.id, c])),
      categoriesBySlug: new Map(snapshot.categories.map((c) => [c.slug, c])),
    };
    indexCache.set(snapshot, index);
  }
  return index;
}

/** Published products of a snapshot (stable reference per snapshot). */
export function publishedProductsOf(snapshot: CatalogSnapshot): readonly ProductRecord[] {
  return indexOf(snapshot).published;
}

/** O(1) lookup inside a snapshot; drafts are returned only when `includeDrafts` is true. */
export function lookupProduct(
  snapshot: CatalogSnapshot,
  id: string | null | undefined,
  includeDrafts = false,
): ProductRecord | undefined {
  if (!id) return undefined;
  const product = indexOf(snapshot).byId.get(id);
  return product && (includeDrafts || isProductPublished(product)) ? product : undefined;
}

export function getPublishedProducts(): readonly ProductRecord[] {
  return publishedProductsOf(getCatalog());
}

/** Includes drafts (admin use). Storefront code should use lib/catalog.ts, which hides drafts. */
export function getProductById(id: string | null | undefined): ProductRecord | undefined {
  return lookupProduct(getCatalog(), id, true);
}

/** Includes drafts (admin use). */
export function getProductBySlug(slug: string | null | undefined): ProductRecord | undefined {
  return slug ? indexOf(getCatalog()).bySlug.get(slug) : undefined;
}

export function getCategoryById(id: string | null | undefined): CategoryRecord | undefined {
  return id ? indexOf(getCatalog()).categoriesById.get(id) : undefined;
}

export function getCategoryBySlug(slug: string | null | undefined): CategoryRecord | undefined {
  return slug ? indexOf(getCatalog()).categoriesBySlug.get(slug) : undefined;
}

/** The static record a product started from (undefined for admin-created products). */
export function getBaseProductById(id: string | null | undefined): ProductRecord | undefined {
  return id ? MOCK_PRODUCTS.find((p) => p.id === id) : undefined;
}

export function isBaseProduct(id: string): boolean {
  return MOCK_PRODUCTS.some((p) => p.id === id);
}

export function isBaseCategory(id: string): boolean {
  return MOCK_CATEGORIES.some((c) => c.id === id);
}

export type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock';

/** Sellable units: sum of active variant stock when the product has variants, else product.stock. */
export function totalStock(product: Pick<ProductRecord, 'stock' | 'variants'>): number {
  if (product.variants.length === 0) return Math.max(0, product.stock);
  return product.variants.reduce((sum, v) => sum + (v.isActive ? Math.max(0, v.stock) : 0), 0);
}

export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return 'out_of_stock';
  return stock <= LOW_STOCK_THRESHOLD ? 'low_stock' : 'in_stock';
}

/** Product-level indicator: out of stock when nothing is sellable; low when the total or ANY active variant is <= 5. */
export function productStockLevel(product: Pick<ProductRecord, 'stock' | 'variants'>): StockLevel {
  const total = totalStock(product);
  if (total <= 0) return 'out_of_stock';
  if (total <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return product.variants.some((v) => v.isActive && v.stock <= LOW_STOCK_THRESHOLD) ? 'low_stock' : 'in_stock';
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function uniqueSlug(wanted: string, taken: ReadonlySet<string>, fallback: string): string {
  const base = slugify(wanted) || fallback;
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' && parsed.hostname === ALLOWED_IMAGE_HOST;
  } catch {
    return false;
  }
}

export interface ProductImageInput {
  url: string;
  altText?: string;
}

export interface ProductVariantInput {
  /** Keep the id of an existing variant when editing so carts keep resolving; omit for new variants. */
  id?: string;
  sku: string;
  /** Defaults to the attribute values joined with " / ". */
  name?: string;
  /** e.g. { color: 'Blue', size: 'M' }. Keys are lower-cased. */
  attributes: Record<string, string>;
  priceDelta: number;
  stock: number;
  isActive: boolean;
}

export interface ProductInput {
  name: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  /** "MRP" shown struck through; null or greater than price. */
  compareAtPrice: number | null;
  /** Ignored when variants are supplied (stock = sum of active variant stock). */
  stock: number;
  brand: string;
  isFeatured: boolean;
  categoryId: string;
  status: ProductStatus;
  images: ProductImageInput[];
  variants: ProductVariantInput[];
  /** Optional custom slug; auto-generated from the name when omitted. */
  slug?: string;
}

export type ProductField =
  | 'name'
  | 'sku'
  | 'description'
  | 'shortDescription'
  | 'price'
  | 'compareAtPrice'
  | 'stock'
  | 'brand'
  | 'categoryId'
  | 'status'
  | 'images'
  | 'variants'
  | 'slug';

export const EMPTY_PRODUCT_INPUT: ProductInput = {
  name: '',
  sku: '',
  description: '',
  shortDescription: '',
  price: 0,
  compareAtPrice: null,
  stock: 0,
  brand: '',
  isFeatured: false,
  categoryId: '',
  status: 'draft',
  images: [],
  variants: [],
};

/** Form-friendly copy of an existing product. */
export function productToInput(product: ProductRecord): ProductInput {
  return {
    name: product.name,
    sku: product.sku,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    brand: product.brand,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId,
    status: productStatus(product),
    images: product.images.map((image) => ({ url: image.url, altText: image.altText })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      attributes: { ...v.attributes },
      priceDelta: v.priceDelta,
      stock: v.stock,
      isActive: v.isActive,
    })),
    slug: product.slug,
  };
}

const isWholeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const normalizeSku = (sku: string) => sku.trim().toUpperCase();

/** Every SKU in use (product + variant level), excluding the product being edited. */
function takenSkus(snapshot: CatalogSnapshot, exceptProductId: string | null): Set<string> {
  const skus = new Set<string>();
  snapshot.products.forEach((p) => {
    if (p.id === exceptProductId) return;
    skus.add(normalizeSku(p.sku));
    p.variants.forEach((v) => skus.add(normalizeSku(v.sku)));
  });
  return skus;
}

export function validateProductInput(
  input: ProductInput,
  exceptProductId: string | null = null,
): FieldErrors<ProductField> {
  const errors: FieldErrors<ProductField> = {};
  const snapshot = getCatalog();

  const name = input.name.trim();
  if (!name) errors.name = 'Product name is required';
  else if (name.length < 3) errors.name = 'Product name must be at least 3 characters';
  else if (name.length > PRODUCT_NAME_MAX) errors.name = `Product name must be ${PRODUCT_NAME_MAX} characters or fewer`;

  const skus = takenSkus(snapshot, exceptProductId);
  const sku = normalizeSku(input.sku);
  if (!sku) errors.sku = 'SKU is required';
  else if (!/^[A-Z0-9][A-Z0-9._-]{1,39}$/.test(sku)) errors.sku = 'SKU may use letters, numbers, dots, dashes (2-40 characters)';
  else if (skus.has(sku)) errors.sku = 'This SKU is already used by another product';

  if (!input.description.trim()) errors.description = 'Description is required';
  else if (input.description.trim().length > 4000) errors.description = 'Description must be 4000 characters or fewer';
  if (input.shortDescription.trim().length > 200) errors.shortDescription = 'Short description must be 200 characters or fewer';
  if (input.brand.trim().length > 60) errors.brand = 'Brand must be 60 characters or fewer';

  if (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price <= 0) {
    errors.price = 'Price must be greater than 0';
  } else if (input.price > 1_000_000) {
    errors.price = 'Price is too large';
  }
  if (input.compareAtPrice !== null) {
    if (typeof input.compareAtPrice !== 'number' || !Number.isFinite(input.compareAtPrice)) {
      errors.compareAtPrice = 'Enter a valid MRP or leave it empty';
    } else if (!errors.price && input.compareAtPrice <= input.price) {
      errors.compareAtPrice = 'MRP must be greater than the selling price';
    }
  }

  if (input.variants.length === 0 && !isWholeNumber(input.stock)) errors.stock = 'Stock must be a whole number of 0 or more';

  if (!input.categoryId) errors.categoryId = 'Select a category';
  else if (!snapshot.categories.some((c) => c.id === input.categoryId)) errors.categoryId = 'Select a valid category';

  if (input.status !== 'published' && input.status !== 'draft') errors.status = 'Select a status';

  if (input.images.length > 8) errors.images = 'Add up to 8 images';
  else if (input.images.some((image) => !isAllowedImageUrl(image.url))) errors.images = IMAGE_URL_HINT;
  else if (input.status === 'published' && input.images.length === 0) errors.images = 'Add at least one image before publishing';

  if (input.variants.length > 30) {
    errors.variants = 'Add up to 30 variants';
  } else {
    const seen = new Set<string>(sku ? [sku] : []);
    for (const [index, variant] of input.variants.entries()) {
      const label = `Variant ${index + 1}`;
      const variantSku = normalizeSku(variant.sku);
      const attributes = Object.entries(variant.attributes ?? {}).filter(([k, v]) => k.trim() && String(v).trim());
      if (!variantSku) errors.variants = `${label}: SKU is required`;
      else if (seen.has(variantSku) || skus.has(variantSku)) errors.variants = `${label}: SKU ${variantSku} is already in use`;
      else if (attributes.length === 0) errors.variants = `${label}: add at least one option (e.g. color or size)`;
      else if (!isWholeNumber(variant.stock)) errors.variants = `${label}: stock must be a whole number of 0 or more`;
      else if (typeof variant.priceDelta !== 'number' || !Number.isFinite(variant.priceDelta)) {
        errors.variants = `${label}: enter a valid price difference`;
      } else if (!errors.price && input.price + variant.priceDelta <= 0) {
        errors.variants = `${label}: the variant price must stay above 0`;
      }
      if (errors.variants) break;
      seen.add(variantSku);
    }
  }

  if (input.slug !== undefined && input.slug.trim() && !slugify(input.slug)) errors.slug = 'Enter a valid URL slug';

  return errors;
}

function takenProductSlugs(snapshot: CatalogSnapshot, exceptProductId: string | null): Set<string> {
  // Base slugs stay reserved even when the base product was deleted: the server still serves those URLs.
  const slugs = new Set(MOCK_PRODUCTS.filter((p) => p.id !== exceptProductId).map((p) => p.slug));
  snapshot.products.forEach((p) => {
    if (p.id !== exceptProductId) slugs.add(p.slug);
  });
  return slugs;
}

function buildVariants(inputs: readonly ProductVariantInput[], existing: readonly ProductVariantRecord[]): ProductVariantRecord[] {
  const existingIds = new Set(existing.map((v) => v.id));
  const usedIds = new Set<string>();
  return inputs.map((input) => {
    const attributes: Record<string, string> = {};
    Object.entries(input.attributes ?? {}).forEach(([key, value]) => {
      const k = key.trim().toLowerCase();
      const v = String(value).trim();
      if (k && v) attributes[k] = v;
    });
    let id = input.id && existingIds.has(input.id) && !usedIds.has(input.id) ? input.id : randomId('var');
    while (usedIds.has(id)) id = randomId('var');
    usedIds.add(id);
    return {
      id,
      sku: normalizeSku(input.sku),
      name: input.name?.trim() || Object.values(attributes).join(' / '),
      attributes,
      priceDelta: roundMoney(input.priceDelta),
      stock: Math.max(0, Math.floor(input.stock)),
      isActive: !!input.isActive,
    };
  });
}

function buildImages(inputs: readonly ProductImageInput[], productName: string): ProductImageRecord[] {
  return inputs.map((image, index) => ({
    id: randomId('img'),
    url: image.url.trim(),
    altText: image.altText?.trim() || productName,
    sortOrder: index,
  }));
}

function buildProduct(input: ProductInput, existing: ProductRecord | null): ProductRecord {
  const snapshot = getCatalog();
  const category = snapshot.categories.find((c) => c.id === input.categoryId);
  const name = input.name.trim();
  const variants = buildVariants(input.variants, existing?.variants ?? []);
  const now = new Date().toISOString();
  const slugSource = input.slug?.trim() ? input.slug : existing ? existing.slug : name;
  const record: ProductRecord = {
    id: existing?.id ?? randomId('prod'),
    name,
    slug: uniqueSlug(slugSource, takenProductSlugs(snapshot, existing?.id ?? null), 'product'),
    sku: normalizeSku(input.sku),
    description: input.description.trim(),
    shortDescription: input.shortDescription.trim(),
    price: roundMoney(input.price),
    compareAtPrice: input.compareAtPrice === null ? null : roundMoney(input.compareAtPrice),
    stock: 0,
    brand: input.brand.trim(),
    isFeatured: !!input.isFeatured,
    avgRating: existing?.avgRating ?? 0,
    reviewCount: existing?.reviewCount ?? 0,
    categoryId: input.categoryId,
    categorySlug: category?.slug ?? '',
    categoryName: category?.name ?? '',
    images: buildImages(input.images, name),
    variants,
    createdAt: existing?.createdAt ?? now,
    status: input.status,
    updatedAt: now,
  };
  record.stock = variants.length > 0 ? totalStock(record) : Math.max(0, Math.floor(input.stock));
  return record;
}

function saveProduct(record: ProductRecord): void {
  productOverridesStore().update((map) => ({ ...map, [record.id]: record }));
}

export function createProduct(input: ProductInput): ServiceResult<ProductRecord> {
  const fieldErrors = validateProductInput(input, null);
  if (hasErrors(fieldErrors)) return { ok: false, error: CATALOG_FORM_ERROR, fieldErrors };
  const record = buildProduct(input, null);
  saveProduct(record);
  return { ok: true, data: record };
}

export function updateProduct(id: string, patch: Partial<ProductInput>): ServiceResult<ProductRecord> {
  const existing = getProductById(id);
  if (!existing) return { ok: false, error: 'Product not found' };
  const input: ProductInput = { ...productToInput(existing), ...patch };
  const fieldErrors = validateProductInput(input, id);
  if (hasErrors(fieldErrors)) return { ok: false, error: CATALOG_FORM_ERROR, fieldErrors };
  const record = buildProduct(input, existing);
  // Keep image ids stable when the URLs did not change (avoids needless re-renders / key churn).
  record.images = record.images.map((image, index) =>
    existing.images[index]?.url === image.url ? { ...image, id: existing.images[index].id } : image,
  );
  saveProduct(record);
  return { ok: true, data: record };
}

export function deleteProduct(id: string): ServiceResult {
  if (!getProductById(id)) return { ok: false, error: 'Product not found' };
  productOverridesStore().update((map) => {
    if (!(id in map)) return map;
    const next = { ...map };
    delete next[id];
    return next;
  });
  if (isBaseProduct(id)) deletedProductsStore().update((ids) => (ids.includes(id) ? ids : [...ids, id]));
  return { ok: true, data: undefined };
}

export function setProductStatus(id: string, status: ProductStatus): ServiceResult<ProductRecord> {
  const existing = getProductById(id);
  if (!existing) return { ok: false, error: 'Product not found' };
  if (status !== 'published' && status !== 'draft') return { ok: false, error: 'Select a status' };
  if (status === 'published' && existing.images.length === 0) {
    return { ok: false, error: 'Add at least one image before publishing', fieldErrors: { images: 'Add at least one image before publishing' } };
  }
  const record: ProductRecord = { ...existing, status, updatedAt: new Date().toISOString() };
  saveProduct(record);
  return { ok: true, data: record };
}

const STOCK_ERROR = 'Stock must be a whole number of 0 or more';

export function setStock(productId: string, stock: number): ServiceResult<ProductRecord> {
  const existing = getProductById(productId);
  if (!existing) return { ok: false, error: 'Product not found' };
  if (existing.variants.length > 0) {
    return { ok: false, error: 'This product has variants. Update the stock of each variant instead.' };
  }
  if (!isWholeNumber(stock)) return { ok: false, error: STOCK_ERROR, fieldErrors: { stock: STOCK_ERROR } };
  const record: ProductRecord = { ...existing, stock, updatedAt: new Date().toISOString() };
  saveProduct(record);
  return { ok: true, data: record };
}

export function setVariantStock(productId: string, variantId: string, stock: number): ServiceResult<ProductRecord> {
  const existing = getProductById(productId);
  if (!existing) return { ok: false, error: 'Product not found' };
  if (!existing.variants.some((v) => v.id === variantId)) return { ok: false, error: 'Variant not found' };
  if (!isWholeNumber(stock)) return { ok: false, error: STOCK_ERROR, fieldErrors: { stock: STOCK_ERROR } };
  const variants = existing.variants.map((v) => (v.id === variantId ? { ...v, stock } : v));
  const record: ProductRecord = { ...existing, variants, updatedAt: new Date().toISOString() };
  record.stock = totalStock(record);
  saveProduct(record);
  return { ok: true, data: record };
}

export interface StockLine {
  productId: string;
  variantId: string | null;
  quantity: number;
}

/**
 * Applies order quantities to inventory in ONE write. 'decrement' when an order is placed,
 * 'increment' when it is cancelled. Clamps at 0, works at variant level when `variantId` is set and
 * keeps product.stock = sum of active variant stock for variant products. Lines whose product or
 * variant no longer exists are skipped. Returns the ids of the products that changed.
 */
export function adjustStock(lines: readonly StockLine[], direction: 'decrement' | 'increment'): string[] {
  const sign = direction === 'decrement' ? -1 : 1;
  const changed = new Map<string, ProductRecord>();
  for (const line of lines) {
    const quantity = Math.floor(line.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    const current = changed.get(line.productId) ?? getProductById(line.productId);
    if (!current) continue;
    let next: ProductRecord;
    if (current.variants.length > 0) {
      if (!line.variantId || !current.variants.some((v) => v.id === line.variantId)) continue;
      const variants = current.variants.map((v) =>
        v.id === line.variantId ? { ...v, stock: Math.max(0, v.stock + sign * quantity) } : v,
      );
      next = { ...current, variants };
      next.stock = totalStock(next);
    } else {
      next = { ...current, stock: Math.max(0, current.stock + sign * quantity) };
    }
    changed.set(line.productId, next);
  }
  if (changed.size === 0) return [];
  const now = new Date().toISOString();
  productOverridesStore().update((map) => {
    const nextMap = { ...map };
    changed.forEach((record, id) => {
      nextMap[id] = { ...record, updatedAt: now };
    });
    return nextMap;
  });
  return [...changed.keys()];
}

export interface CategoryInput {
  name: string;
  description: string;
  /** '' for none; otherwise an https://images.unsplash.com URL. */
  imageUrl: string;
  sortOrder?: number;
  slug?: string;
}

export type CategoryField = 'name' | 'description' | 'imageUrl' | 'sortOrder' | 'slug';

export const EMPTY_CATEGORY_INPUT: CategoryInput = { name: '', description: '', imageUrl: '' };

export function categoryToInput(category: CategoryRecord): CategoryInput {
  return {
    name: category.name,
    description: category.description ?? '',
    imageUrl: category.imageUrl ?? '',
    sortOrder: category.sortOrder,
    slug: category.slug,
  };
}

export function validateCategoryInput(input: CategoryInput, exceptCategoryId: string | null = null): FieldErrors<CategoryField> {
  const errors: FieldErrors<CategoryField> = {};
  const name = input.name.trim();
  if (!name) errors.name = 'Category name is required';
  else if (name.length < 2) errors.name = 'Category name must be at least 2 characters';
  else if (name.length > 60) errors.name = 'Category name must be 60 characters or fewer';
  else if (
    getCatalog().categories.some((c) => c.id !== exceptCategoryId && c.name.trim().toLowerCase() === name.toLowerCase())
  ) {
    errors.name = 'A category with this name already exists';
  }
  if (input.description.trim().length > 300) errors.description = 'Description must be 300 characters or fewer';
  if (input.imageUrl.trim() && !isAllowedImageUrl(input.imageUrl)) errors.imageUrl = IMAGE_URL_HINT;
  if (input.sortOrder !== undefined && (!Number.isFinite(input.sortOrder) || input.sortOrder < 0)) {
    errors.sortOrder = 'Sort order must be 0 or more';
  }
  if (input.slug !== undefined && input.slug.trim() && !slugify(input.slug)) errors.slug = 'Enter a valid URL slug';
  return errors;
}

function takenCategorySlugs(exceptCategoryId: string | null): Set<string> {
  const slugs = new Set(MOCK_CATEGORIES.filter((c) => c.id !== exceptCategoryId).map((c) => c.slug));
  getCatalog().categories.forEach((c) => {
    if (c.id !== exceptCategoryId) slugs.add(c.slug);
  });
  return slugs;
}

function buildCategory(input: CategoryInput, existing: CategoryRecord | null): CategoryRecord {
  const categories = getCatalog().categories;
  const name = input.name.trim();
  const slugSource = input.slug?.trim() ? input.slug : existing ? existing.slug : name;
  return {
    id: existing?.id ?? randomId('cat'),
    name,
    slug: uniqueSlug(slugSource, takenCategorySlugs(existing?.id ?? null), 'category'),
    description: input.description.trim() || null,
    imageUrl: input.imageUrl.trim() || null,
    sortOrder:
      input.sortOrder !== undefined
        ? Math.floor(input.sortOrder)
        : (existing?.sortOrder ?? categories.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1),
    productCount: existing?.productCount ?? 0,
  };
}

export function createCategory(input: CategoryInput): ServiceResult<CategoryRecord> {
  const fieldErrors = validateCategoryInput(input, null);
  if (hasErrors(fieldErrors)) return { ok: false, error: CATALOG_FORM_ERROR, fieldErrors };
  const record = buildCategory(input, null);
  categoryOverridesStore().update((map) => ({ ...map, [record.id]: record }));
  return { ok: true, data: record };
}

/** Products keep pointing at the category by id; their categoryName/categorySlug follow automatically. */
export function updateCategory(id: string, patch: Partial<CategoryInput>): ServiceResult<CategoryRecord> {
  const existing = getCategoryById(id);
  if (!existing) return { ok: false, error: 'Category not found' };
  const input: CategoryInput = { ...categoryToInput(existing), ...patch };
  const fieldErrors = validateCategoryInput(input, id);
  if (hasErrors(fieldErrors)) return { ok: false, error: CATALOG_FORM_ERROR, fieldErrors };
  const record = buildCategory(input, existing);
  categoryOverridesStore().update((map) => ({ ...map, [record.id]: record }));
  return { ok: true, data: record };
}

export function deleteCategory(id: string): ServiceResult {
  const existing = getCategoryById(id);
  if (!existing) return { ok: false, error: 'Category not found' };
  const inUse = getCatalog().products.filter((p) => p.categoryId === id).length;
  if (inUse > 0) {
    return {
      ok: false,
      error: `${existing.name} still has ${inUse} product${inUse === 1 ? '' : 's'}. Move or delete them before deleting the category.`,
    };
  }
  categoryOverridesStore().update((map) => {
    if (!(id in map)) return map;
    const next = { ...map };
    delete next[id];
    return next;
  });
  if (isBaseCategory(id)) deletedCategoriesStore().update((ids) => (ids.includes(id) ? ids : [...ids, id]));
  return { ok: true, data: undefined };
}

/** Demo reset: drops every admin catalog change (edits, new products, deletions, stock movements). */
export function resetCatalog(): void {
  productOverridesStore().clear();
  deletedProductsStore().clear();
  categoryOverridesStore().clear();
  deletedCategoriesStore().clear();
}
