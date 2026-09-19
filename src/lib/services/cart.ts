import {
  cartLineKey,
  getAvailableStock,
  getEffectivePrice,
  getProductById,
  getProductImage,
  getVariant,
  getVariantLabel,
  resolveCartVariant,
} from '../catalog';
import { normalizeCouponCode, validateCoupon, type CouponValidation } from '../coupons';
import type { ProductRecord, ProductVariantRecord } from '../mockTypes';
import { calculateTotals, lineTotal, roundMoney, type CartTotals } from '../pricing';
import { GUEST_OWNER, getJsonStore, isRecord, sanitizeArray, storageKeys } from '../storage';
import type { AddToCartResult, CartItem, SetQuantityResult } from './types';

export const OUT_OF_STOCK_MESSAGE = 'Out of stock';
export const PRODUCT_UNAVAILABLE_MESSAGE = 'This product is no longer available';
export const onlyLeftMessage = (stock: number) => `Only ${stock} left in stock`;

const EMPTY_CART: CartItem[] = [];

function isCartItem(value: unknown): value is CartItem {
  return (
    isRecord(value) &&
    typeof value.productId === 'string' &&
    (value.variantId === null || typeof value.variantId === 'string') &&
    typeof value.quantity === 'number' &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    typeof value.addedAt === 'string'
  );
}

export function cartStore(owner: string) {
  return getJsonStore(storageKeys.cart(owner), EMPTY_CART, (v) => sanitizeArray(v, isCartItem));
}

export function couponStore(owner: string) {
  return getJsonStore<string | null>(storageKeys.coupon(owner), null, (v) =>
    typeof v === 'string' && v.trim() ? normalizeCouponCode(v) : null,
  );
}

export function getCartItems(owner: string): readonly CartItem[] {
  return cartStore(owner).get();
}

export function getCartCouponCode(owner: string): string | null {
  return couponStore(owner).get();
}

export function setCartCouponCode(owner: string, code: string | null): void {
  if (code && code.trim()) couponStore(owner).set(normalizeCouponCode(code));
  else couponStore(owner).clear();
}

const isLine = (item: CartItem, productId: string, variantId: string | null) =>
  item.productId === productId && item.variantId === variantId;

export function getCartLineQuantity(owner: string, productId: string, variantId: string | null = null): number {
  return getCartItems(owner).find((item) => isLine(item, productId, variantId))?.quantity ?? 0;
}

export function addToCart(
  owner: string,
  productId: string,
  variantId?: string | null,
  quantity = 1,
): AddToCartResult {
  const base = { productId, variantId: variantId ?? null, addedQuantity: 0, quantity: 0, availableStock: 0 };
  const product = getProductById(productId);
  if (!product) return { ...base, ok: false, status: 'invalid', message: PRODUCT_UNAVAILABLE_MESSAGE };

  const requested = Math.floor(quantity);
  if (!Number.isFinite(requested) || requested < 1) {
    return { ...base, ok: false, status: 'invalid', message: 'Choose a quantity of at least 1' };
  }

  const resolution = resolveCartVariant(product, variantId);
  if (!resolution.ok) {
    return resolution.reason === 'variant_required'
      ? { ...base, ok: false, status: 'out_of_stock', message: OUT_OF_STOCK_MESSAGE }
      : { ...base, ok: false, status: 'invalid', message: resolution.error };
  }

  const variant = resolution.variant;
  const lineVariantId = variant?.id ?? null;
  const stock = getAvailableStock(product, variant);
  const items = getCartItems(owner);
  const existing = items.find((item) => isLine(item, productId, lineVariantId));
  const current = existing?.quantity ?? 0;
  const result = { productId, variantId: lineVariantId, availableStock: stock };

  if (stock <= 0) {
    return { ...result, ok: false, status: 'out_of_stock', addedQuantity: 0, quantity: current, message: OUT_OF_STOCK_MESSAGE };
  }

  const desired = current + requested;
  const next = Math.min(desired, stock);
  const added = Math.max(0, next - current);

  if (next !== current) {
    cartStore(owner).set(
      existing
        ? items.map((item) => (item === existing ? { ...item, quantity: next } : item))
        : [{ productId, variantId: lineVariantId, quantity: next, addedAt: new Date().toISOString() }, ...items],
    );
  }

  if (next < desired) {
    return {
      ...result,
      ok: added > 0,
      status: 'clamped',
      addedQuantity: added,
      quantity: next,
      message: onlyLeftMessage(stock),
    };
  }
  return { ...result, ok: true, status: 'added', addedQuantity: added, quantity: next, message: null };
}

export function removeFromCart(owner: string, productId: string, variantId: string | null = null): void {
  const items = getCartItems(owner);
  if (!items.some((item) => isLine(item, productId, variantId))) return;
  cartStore(owner).set(items.filter((item) => !isLine(item, productId, variantId)));
}

export function setCartQuantity(
  owner: string,
  productId: string,
  variantId: string | null,
  quantity: number,
): SetQuantityResult {
  const items = getCartItems(owner);
  const existing = items.find((item) => isLine(item, productId, variantId));
  if (!existing) return { status: 'invalid', quantity: 0, availableStock: 0, message: 'This item is no longer in your cart' };

  const requested = Math.floor(quantity);
  if (!Number.isFinite(requested)) {
    return { status: 'invalid', quantity: existing.quantity, availableStock: 0, message: 'Enter a valid quantity' };
  }
  if (requested <= 0) {
    removeFromCart(owner, productId, variantId);
    return { status: 'removed', quantity: 0, availableStock: 0, message: null };
  }

  const product = getProductById(productId);
  const variant = product && variantId ? getVariant(product, variantId) : undefined;
  const lineBroken =
    !product || (variantId ? !variant || !variant.isActive : product.variants.length > 0);
  if (!product || lineBroken) {
    removeFromCart(owner, productId, variantId);
    return { status: 'removed', quantity: 0, availableStock: 0, message: PRODUCT_UNAVAILABLE_MESSAGE };
  }

  const stock = getAvailableStock(product, variant);
  if (stock <= 0) {
    return { status: 'out_of_stock', quantity: existing.quantity, availableStock: 0, message: OUT_OF_STOCK_MESSAGE };
  }

  const next = Math.min(requested, stock);
  if (next !== existing.quantity) {
    cartStore(owner).set(items.map((item) => (item === existing ? { ...item, quantity: next } : item)));
  }
  return next < requested
    ? { status: 'clamped', quantity: next, availableStock: stock, message: onlyLeftMessage(stock) }
    : { status: 'updated', quantity: next, availableStock: stock, message: null };
}

/** Clears cart lines and the applied coupon. */
export function clearCart(owner: string): void {
  cartStore(owner).clear();
  couponStore(owner).clear();
}

/** Guest lines are summed into the user's cart (clamped to stock); guest copies are then cleared. */
export function mergeGuestCartInto(userId: string): { mergedLines: number; clampedLines: number } {
  if (userId === GUEST_OWNER) return { mergedLines: 0, clampedLines: 0 };
  const guestItems = getCartItems(GUEST_OWNER);
  const guestCoupon = getCartCouponCode(GUEST_OWNER);
  let mergedLines = 0;
  let clampedLines = 0;

  if (guestItems.length > 0) {
    const merged = [...getCartItems(userId)];
    for (const guestItem of guestItems) {
      const product = getProductById(guestItem.productId);
      if (!product) continue;
      const resolution = resolveCartVariant(product, guestItem.variantId);
      if (!resolution.ok) continue;
      const lineVariantId = resolution.variant?.id ?? null;
      const stock = getAvailableStock(product, resolution.variant);
      if (stock <= 0) {
        clampedLines++;
        continue;
      }
      const index = merged.findIndex((item) => isLine(item, product.id, lineVariantId));
      const desired = (index >= 0 ? merged[index].quantity : 0) + guestItem.quantity;
      const quantity = Math.min(desired, stock);
      if (quantity < desired) clampedLines++;
      if (index >= 0) merged[index] = { ...merged[index], quantity };
      else merged.push({ productId: product.id, variantId: lineVariantId, quantity, addedAt: guestItem.addedAt });
      mergedLines++;
    }
    cartStore(userId).set(merged);
    cartStore(GUEST_OWNER).clear();
  }

  if (guestCoupon) {
    if (!getCartCouponCode(userId)) setCartCouponCode(userId, guestCoupon);
    couponStore(GUEST_OWNER).clear();
  }

  return { mergedLines, clampedLines };
}

export interface CartLine {
  key: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  addedAt: string;
  product: ProductRecord;
  variant: ProductVariantRecord | null;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  categoryName: string;
  image: string | null;
  variantLabel: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  lineTotal: number;
  availableStock: number;
  isOutOfStock: boolean;
  exceedsStock: boolean;
}

/** Joins stored cart items with catalog data; items whose product/variant no longer resolves are dropped. */
export function buildCartLines(items: readonly CartItem[]): CartLine[] {
  const lines: CartLine[] = [];
  for (const item of items) {
    const product = getProductById(item.productId);
    if (!product) continue;
    let variant: ProductVariantRecord | null = null;
    if (product.variants.length > 0) {
      const found = getVariant(product, item.variantId);
      if (!found) continue;
      variant = found;
    } else if (item.variantId) {
      continue;
    }
    const unitPrice = getEffectivePrice(product, variant);
    const availableStock = getAvailableStock(product, variant);
    lines.push({
      key: cartLineKey(item.productId, item.variantId),
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      product,
      variant,
      name: product.name,
      slug: product.slug,
      sku: variant?.sku ?? product.sku,
      brand: product.brand,
      categoryName: product.categoryName,
      image: getProductImage(product),
      variantLabel: getVariantLabel(variant),
      unitPrice,
      compareAtPrice:
        product.compareAtPrice !== null && product.compareAtPrice > product.price
          ? roundMoney(product.compareAtPrice + (variant?.priceDelta ?? 0))
          : null,
      lineTotal: lineTotal(unitPrice, item.quantity),
      availableStock,
      isOutOfStock: availableStock <= 0,
      exceedsStock: item.quantity > availableStock,
    });
  }
  return lines;
}

/** Drops stored lines whose product/variant no longer resolves in the catalog. */
export function pruneCart(owner: string): number {
  const items = getCartItems(owner);
  const validKeys = new Set(buildCartLines(items).map((line) => line.key));
  const kept = items.filter((item) => validKeys.has(cartLineKey(item.productId, item.variantId)));
  if (kept.length !== items.length) cartStore(owner).set(kept);
  return items.length - kept.length;
}

export interface CartSummary {
  lines: CartLine[];
  totals: CartTotals;
  couponValidation: CouponValidation | null;
}

export function summarizeCart(
  items: readonly CartItem[],
  couponCode: string | null,
  now: number = Date.now(),
): CartSummary {
  const lines = buildCartLines(items);
  const subtotal = calculateTotals(lines).subtotal;
  const couponValidation = couponCode ? validateCoupon(couponCode, subtotal, now) : null;
  const totals = calculateTotals(lines, couponValidation?.ok ? couponValidation.coupon : null);
  return { lines, totals, couponValidation };
}
