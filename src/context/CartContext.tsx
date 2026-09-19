'use client';

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { getProductById, getVariant, getVariantLabel } from '@/lib/catalog';
import { validateCoupon, type CouponValidation } from '@/lib/coupons';
import type { CartTotals } from '@/lib/pricing';
import {
  addToCart,
  cartStore,
  clearCart,
  couponStore,
  getCartCouponCode,
  getCartItems,
  pruneCart,
  removeFromCart,
  setCartCouponCode,
  setCartQuantity,
  summarizeCart,
  type CartLine,
} from '@/lib/services/cart';
import type { AddToCartResult, CartItem, SetQuantityResult } from '@/lib/services/types';
import { useAuth } from './AuthContext';
import { toast } from './ToastContext';

export interface CartActionOptions {
  /** Skip the built-in toast; handle feedback yourself from the returned result. */
  silent?: boolean;
}

export interface AppliedCoupon {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  discount: number;
}

export interface CartState {
  ownerId: string;
  items: readonly CartItem[];
  lines: CartLine[];
  totals: CartTotals;
  itemCount: number;
  isEmpty: boolean;
  /** false during SSR/hydration: render neutral placeholders for counts. */
  isHydrated: boolean;
  hasStockIssues: boolean;
  /** Stored code (removed automatically when it stops validating). */
  couponCode: string | null;
  appliedCoupon: AppliedCoupon | null;
}

export interface CartActions {
  addItem(productId: string, variantId?: string | null, quantity?: number, options?: CartActionOptions): AddToCartResult;
  setQuantity(
    productId: string,
    variantId: string | null,
    quantity: number,
    options?: CartActionOptions,
  ): SetQuantityResult;
  removeItem(productId: string, variantId: string | null, options?: CartActionOptions): void;
  clear(): void;
  applyCoupon(code: string, options?: CartActionOptions): CouponValidation;
  removeCoupon(): void;
  /** variantId undefined = total across all lines of the product; null = the no-variant line. */
  getQuantity(productId: string, variantId?: string | null): number;
}

export type CartContextValue = CartState & CartActions;

const CartStateContext = createContext<CartState | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

function describeLine(productId: string, variantId: string | null): string | undefined {
  const product = getProductById(productId);
  if (!product) return undefined;
  const label = getVariantLabel(variantId ? getVariant(product, variantId) : null);
  return label ? `${product.name} · ${label}` : product.name;
}

const VIEW_CART = { label: 'View cart', href: '/cart' };

function notifyAdd(result: AddToCartResult) {
  const description = describeLine(result.productId, result.variantId);
  if (result.status === 'added') {
    toast.success('Added to cart', { id: 'cart-add', description, action: VIEW_CART });
  } else if (result.status === 'clamped') {
    toast.warning(result.message ?? 'Stock limit reached', {
      id: 'cart-add',
      description: result.addedQuantity > 0 ? `Added ${result.addedQuantity} · ${description ?? ''}` : description,
      action: VIEW_CART,
    });
  } else {
    toast.error(result.message ?? 'Could not add to cart', { id: 'cart-add', description });
  }
}

function dropInvalidCoupon(ownerId: string, code: string, reason: string, notify: boolean) {
  if (getCartCouponCode(ownerId) !== code) return;
  setCartCouponCode(ownerId, null);
  if (notify) toast.warning(`Coupon ${code} removed`, { id: `coupon-removed-${code}`, description: reason });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { ownerId, isHydrated } = useAuth();
  const itemsStore = useMemo(() => cartStore(ownerId), [ownerId]);
  const codeStore = useMemo(() => couponStore(ownerId), [ownerId]);
  const items = useSyncExternalStore(itemsStore.subscribe, itemsStore.get, itemsStore.getServerSnapshot);
  const couponCode = useSyncExternalStore(codeStore.subscribe, codeStore.get, codeStore.getServerSnapshot);
  const { lines, totals, couponValidation } = useMemo(() => summarizeCart(items, couponCode), [items, couponCode]);

  useEffect(() => {
    if (lines.length !== items.length) pruneCart(ownerId);
  }, [ownerId, lines.length, items.length]);

  const invalidCouponReason = couponValidation && !couponValidation.ok ? couponValidation.error : null;
  const hasItems = items.length > 0;
  useEffect(() => {
    if (couponCode && invalidCouponReason) dropInvalidCoupon(ownerId, couponCode, invalidCouponReason, hasItems);
  }, [ownerId, couponCode, invalidCouponReason, hasItems]);

  const state = useMemo<CartState>(
    () => ({
      ownerId,
      items,
      lines,
      totals,
      itemCount: totals.itemCount,
      isEmpty: lines.length === 0,
      isHydrated,
      hasStockIssues: lines.some((line) => line.isOutOfStock || line.exceedsStock),
      couponCode,
      appliedCoupon: couponValidation?.ok
        ? {
            code: couponValidation.coupon.code,
            description: couponValidation.coupon.description,
            type: couponValidation.coupon.type,
            value: couponValidation.coupon.value,
            discount: totals.discount,
          }
        : null,
    }),
    [ownerId, items, lines, totals, isHydrated, couponCode, couponValidation],
  );

  const actions = useMemo<CartActions>(
    () => ({
      addItem: (productId, variantId, quantity = 1, options) => {
        const result = addToCart(ownerId, productId, variantId, quantity);
        if (!options?.silent) notifyAdd(result);
        return result;
      },
      setQuantity: (productId, variantId, quantity, options) => {
        const result = setCartQuantity(ownerId, productId, variantId, quantity);
        if (!options?.silent && result.message) {
          const id = `cart-qty-${productId}-${variantId ?? 'base'}`;
          if (result.status === 'clamped') toast.warning(result.message, { id });
          else toast.error(result.message, { id });
        }
        return result;
      },
      removeItem: (productId, variantId, options) => {
        const description = describeLine(productId, variantId);
        removeFromCart(ownerId, productId, variantId);
        if (!options?.silent) toast.info('Removed from cart', { id: 'cart-remove', description });
      },
      clear: () => clearCart(ownerId),
      applyCoupon: (code, options) => {
        const { subtotal } = summarizeCart(getCartItems(ownerId), null).totals;
        const result = validateCoupon(code, subtotal);
        if (result.ok) {
          setCartCouponCode(ownerId, result.coupon.code);
          if (!options?.silent) {
            toast.success(`Coupon ${result.coupon.code} applied`, { id: 'coupon', description: result.coupon.description });
          }
        }
        return result;
      },
      removeCoupon: () => setCartCouponCode(ownerId, null),
      getQuantity: (productId, variantId) =>
        getCartItems(ownerId)
          .filter((item) => item.productId === productId && (variantId === undefined || item.variantId === variantId))
          .reduce((sum, item) => sum + item.quantity, 0),
    }),
    [ownerId],
  );

  return (
    <CartActionsContext.Provider value={actions}>
      <CartStateContext.Provider value={state}>{children}</CartStateContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCartActions(): CartActions {
  const context = useContext(CartActionsContext);
  if (!context) throw new Error('useCartActions must be used within <CartProvider>');
  return context;
}

export function useCart(): CartContextValue {
  const state = useContext(CartStateContext);
  const actions = useContext(CartActionsContext);
  if (!state || !actions) throw new Error('useCart must be used within <CartProvider>');
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
