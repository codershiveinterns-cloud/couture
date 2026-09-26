// Client-side catalog lookups used by the cart, wishlist, orders and search suggestions.
// They resolve against the EFFECTIVE catalog (base data + admin overrides, see services/catalogStore),
// so admin price/stock edits flow into the bag, and draft/deleted products are treated as unavailable.
// On the server the effective catalog is the base catalog.

import type { CategoryRecord, ProductRecord, ProductVariantRecord } from './mockTypes';
import { roundMoney } from './pricing';
import {
  getCatalog,
  getCategoryBySlug as getEffectiveCategoryBySlug,
  getProductBySlug as getEffectiveProductBySlug,
  getPublishedProducts,
  isProductPublished,
  lookupProduct,
} from './services/catalogStore';

export type CatalogProduct = ProductRecord;
export type CatalogVariant = ProductVariantRecord;
export type CatalogCategory = CategoryRecord;

/** Structural shapes so helpers accept both mock records and API ProductDetail objects. */
export interface VariantLike {
  id: string;
  sku?: string;
  name?: string;
  attributes: Record<string, string>;
  priceDelta: number;
  stock: number;
  isActive: boolean;
}

export interface ProductLike<V extends VariantLike = VariantLike> {
  id: string;
  price: number;
  stock: number;
  variants: readonly V[];
}

/** Published products of the effective catalog, newest first. */
export function getAllProducts(): readonly ProductRecord[] {
  return getPublishedProducts();
}

export function getAllCategories(): readonly CategoryRecord[] {
  return getCatalog().categories;
}

/** undefined for unknown, deleted and unpublished (draft) products. */
export function getProductById(id: string | null | undefined): ProductRecord | undefined {
  return lookupProduct(getCatalog(), id);
}

export function getProductBySlugSync(slug: string | null | undefined): ProductRecord | undefined {
  const product = getEffectiveProductBySlug(slug);
  return product && isProductPublished(product) ? product : undefined;
}

export function getCategoryBySlugSync(slug: string | null | undefined): CategoryRecord | undefined {
  return getEffectiveCategoryBySlug(slug);
}

export function hasVariants(product: ProductLike): boolean {
  return product.variants.length > 0;
}

export function getActiveVariants<V extends VariantLike>(product: ProductLike<V>): V[] {
  return product.variants.filter((v) => v.isActive);
}

export function getVariant<V extends VariantLike>(
  product: ProductLike<V>,
  variantId: string | null | undefined,
): V | undefined {
  if (!variantId) return undefined;
  return product.variants.find((v) => v.id === variantId);
}

/** First active variant with stock > 0; null when the product has no variants or none are purchasable. */
export function getDefaultVariant<V extends VariantLike>(product: ProductLike<V>): V | null {
  return product.variants.find((v) => v.isActive && v.stock > 0) ?? null;
}

export function getEffectivePrice(product: ProductLike, variant?: VariantLike | null): number {
  return roundMoney(product.price + (variant?.priceDelta ?? 0));
}

export function getAvailableStock(product: ProductLike, variant?: VariantLike | null): number {
  if (variant) return variant.isActive ? Math.max(0, variant.stock) : 0;
  return Math.max(0, product.stock);
}

/** true when the product itself or any active variant has stock. */
export function isProductInStock(product: ProductLike): boolean {
  if (product.variants.length === 0) return product.stock > 0;
  return product.stock > 0 || product.variants.some((v) => v.isActive && v.stock > 0);
}

export function formatAttributeName(key: string): string {
  if (!key) return key;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** "Color: Blue" or "Color: Blue · Size: M"; null when there is no variant. */
export function getVariantLabel(variant: Pick<VariantLike, 'attributes'> | null | undefined): string | null {
  if (!variant) return null;
  const parts = Object.entries(variant.attributes).map(([key, value]) => `${formatAttributeName(key)}: ${value}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Attribute keys present on a product's variants, e.g. ["color"]. */
export function getVariantAttributeKeys(product: ProductLike): string[] {
  const keys = new Set<string>();
  product.variants.forEach((v) => Object.keys(v.attributes).forEach((k) => keys.add(k)));
  return [...keys];
}

export function getProductImage(product: { images: readonly { url: string }[] }): string | null {
  return product.images[0]?.url ?? null;
}

export type VariantResolution<V extends VariantLike> =
  | { ok: true; variant: V | null }
  | { ok: false; reason: 'variant_required' | 'variant_unavailable'; error: string };

/**
 * Resolves the variant a cart line should use. Variant products require a variant: when
 * `variantId` is omitted the default (first active, in-stock) variant is chosen.
 * Products without variants always resolve to null.
 */
export function resolveCartVariant<V extends VariantLike>(
  product: ProductLike<V>,
  variantId: string | null | undefined,
): VariantResolution<V> {
  if (product.variants.length === 0) return { ok: true, variant: null };
  if (!variantId) {
    const fallback = getDefaultVariant(product);
    return fallback
      ? { ok: true, variant: fallback }
      : { ok: false, reason: 'variant_required', error: 'Out of stock' };
  }
  const variant = getVariant(product, variantId);
  if (!variant || !variant.isActive) {
    return { ok: false, reason: 'variant_unavailable', error: 'This option is no longer available' };
  }
  return { ok: true, variant };
}

export function cartLineKey(productId: string, variantId: string | null | undefined): string {
  return `${productId}::${variantId ?? 'base'}`;
}
