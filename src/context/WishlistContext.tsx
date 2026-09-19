'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { getProductById, getVariant, getVariantLabel } from '@/lib/catalog';
import type { ProductRecord } from '@/lib/mockTypes';
import type { AddToCartResult, WishlistItem } from '@/lib/services/types';
import {
  addToWishlist,
  clearWishlist,
  isInWishlist,
  moveWishlistItemToCart,
  removeFromWishlist,
  toggleWishlist,
  wishlistStore,
} from '@/lib/services/wishlist';
import { useAuth } from './AuthContext';
import { toast } from './ToastContext';

export interface WishlistActionOptions {
  silent?: boolean;
}

export interface WishlistState {
  ownerId: string;
  items: readonly WishlistItem[];
  /** Catalog records for saved items that still exist, newest first. */
  products: ProductRecord[];
  count: number;
  isHydrated: boolean;
  has(productId: string): boolean;
}

export interface WishlistActions {
  toggle(productId: string, options?: WishlistActionOptions): { added: boolean; inWishlist: boolean };
  add(productId: string, options?: WishlistActionOptions): boolean;
  remove(productId: string, options?: WishlistActionOptions): boolean;
  /** Adds to cart (default variant when omitted) and removes from the wishlist once it is in the cart. */
  moveToCart(
    productId: string,
    variantId?: string | null,
    options?: WishlistActionOptions,
  ): AddToCartResult;
  clear(): void;
  isSaved(productId: string): boolean;
}

export type WishlistContextValue = WishlistState & WishlistActions;

const WishlistStateContext = createContext<WishlistState | null>(null);
const WishlistActionsContext = createContext<WishlistActions | null>(null);

const VIEW_WISHLIST = { label: 'View wishlist', href: '/wishlist' };

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { ownerId, isHydrated } = useAuth();
  const store = useMemo(() => wishlistStore(ownerId), [ownerId]);
  const items = useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);

  const state = useMemo<WishlistState>(() => {
    const ids = new Set(items.map((item) => item.productId));
    const products = items
      .map((item) => getProductById(item.productId))
      .filter((product): product is ProductRecord => !!product);
    return {
      ownerId,
      items,
      products,
      count: products.length,
      isHydrated,
      has: (productId) => ids.has(productId),
    };
  }, [ownerId, items, isHydrated]);

  const actions = useMemo<WishlistActions>(
    () => ({
      toggle: (productId, options) => {
        const result = toggleWishlist(ownerId, productId);
        if (!options?.silent) {
          const description = getProductById(productId)?.name;
          if (result.added) toast.success('Saved to wishlist', { id: 'wishlist', description, action: VIEW_WISHLIST });
          else toast.info('Removed from wishlist', { id: 'wishlist', description });
        }
        return result;
      },
      add: (productId, options) => {
        const added = addToWishlist(ownerId, productId);
        if (added && !options?.silent) {
          toast.success('Saved to wishlist', {
            id: 'wishlist',
            description: getProductById(productId)?.name,
            action: VIEW_WISHLIST,
          });
        }
        return added;
      },
      remove: (productId, options) => {
        const removed = removeFromWishlist(ownerId, productId);
        if (removed && !options?.silent) {
          toast.info('Removed from wishlist', { id: 'wishlist', description: getProductById(productId)?.name });
        }
        return removed;
      },
      moveToCart: (productId, variantId, options) => {
        const result = moveWishlistItemToCart(ownerId, productId, variantId);
        if (!options?.silent) {
          const product = getProductById(productId);
          const label = product && result.variantId ? getVariantLabel(getVariant(product, result.variantId)) : null;
          const description = product ? (label ? `${product.name} · ${label}` : product.name) : undefined;
          const action = { label: 'View cart', href: '/cart' };
          if (result.status === 'added') toast.success('Moved to cart', { id: 'wishlist', description, action });
          else if (result.quantity > 0) toast.warning(result.message ?? 'Moved to cart', { id: 'wishlist', description, action });
          else toast.error(result.message ?? 'Could not move to cart', { id: 'wishlist', description });
        }
        return result;
      },
      clear: () => clearWishlist(ownerId),
      isSaved: (productId) => isInWishlist(ownerId, productId),
    }),
    [ownerId],
  );

  return (
    <WishlistActionsContext.Provider value={actions}>
      <WishlistStateContext.Provider value={state}>{children}</WishlistStateContext.Provider>
    </WishlistActionsContext.Provider>
  );
}

export function useWishlistActions(): WishlistActions {
  const context = useContext(WishlistActionsContext);
  if (!context) throw new Error('useWishlistActions must be used within <WishlistProvider>');
  return context;
}

export function useWishlist(): WishlistContextValue {
  const state = useContext(WishlistStateContext);
  const actions = useContext(WishlistActionsContext);
  if (!state || !actions) throw new Error('useWishlist must be used within <WishlistProvider>');
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
