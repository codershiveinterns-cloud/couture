import { getProductById } from '../catalog';
import { GUEST_OWNER, getJsonStore, isRecord, sanitizeArray, storageKeys } from '../storage';
import { addToCart } from './cart';
import type { AddToCartResult, WishlistItem } from './types';

const EMPTY_WISHLIST: WishlistItem[] = [];

function isWishlistItem(value: unknown): value is WishlistItem {
  return isRecord(value) && typeof value.productId === 'string' && typeof value.addedAt === 'string';
}

export function wishlistStore(owner: string) {
  return getJsonStore(storageKeys.wishlist(owner), EMPTY_WISHLIST, (v) => sanitizeArray(v, isWishlistItem));
}

export function getWishlistItems(owner: string): readonly WishlistItem[] {
  return wishlistStore(owner).get();
}

export function isInWishlist(owner: string, productId: string): boolean {
  return getWishlistItems(owner).some((item) => item.productId === productId);
}

/** Returns true when the product was newly added. */
export function addToWishlist(owner: string, productId: string): boolean {
  if (!getProductById(productId) || isInWishlist(owner, productId)) return false;
  wishlistStore(owner).set([{ productId, addedAt: new Date().toISOString() }, ...getWishlistItems(owner)]);
  return true;
}

/** Returns true when the product was removed. */
export function removeFromWishlist(owner: string, productId: string): boolean {
  const items = getWishlistItems(owner);
  if (!items.some((item) => item.productId === productId)) return false;
  wishlistStore(owner).set(items.filter((item) => item.productId !== productId));
  return true;
}

export function toggleWishlist(owner: string, productId: string): { added: boolean; inWishlist: boolean } {
  if (isInWishlist(owner, productId)) {
    removeFromWishlist(owner, productId);
    return { added: false, inWishlist: false };
  }
  const added = addToWishlist(owner, productId);
  return { added, inWishlist: added };
}

export function clearWishlist(owner: string): void {
  wishlistStore(owner).clear();
}

/** Adds to cart (default variant when none given); removes from the wishlist once the product is in the cart. */
export function moveWishlistItemToCart(
  owner: string,
  productId: string,
  variantId?: string | null,
  quantity = 1,
): AddToCartResult {
  const result = addToCart(owner, productId, variantId, quantity);
  if (result.quantity > 0) removeFromWishlist(owner, productId);
  return result;
}

export function mergeGuestWishlistInto(userId: string): { added: number } {
  if (userId === GUEST_OWNER) return { added: 0 };
  const guestItems = getWishlistItems(GUEST_OWNER);
  if (guestItems.length === 0) return { added: 0 };
  const userItems = getWishlistItems(userId);
  const known = new Set(userItems.map((item) => item.productId));
  const additions = guestItems.filter((item) => !known.has(item.productId) && getProductById(item.productId));
  if (additions.length > 0) wishlistStore(userId).set([...additions, ...userItems]);
  wishlistStore(GUEST_OWNER).clear();
  return { added: additions.length };
}
