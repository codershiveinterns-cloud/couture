'use client';

import Link from 'next/link';
import { useId } from 'react';
import FadeImage from '@/components/FadeImage';
import { toast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/format';
import type { CartLine } from '@/lib/services/cart';
import { discountPercent } from './priceUtils';

const MAX_QTY_OPTIONS = 10;

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5 17.7 5 19.5 8.2 22 11.9 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function CartLineItem({ line }: { line: CartLine }) {
  const { setQuantity, removeItem } = useCart();
  const wishlist = useWishlist();
  const qtyId = useId();
  const href = `/products/${line.slug}`;
  const percentOff = discountPercent(line.unitPrice, line.compareAtPrice);
  const mrpTotal = line.compareAtPrice !== null && line.compareAtPrice > line.unitPrice ? line.compareAtPrice * line.quantity : null;
  const stockNote = line.isOutOfStock
    ? 'This item is out of stock. Remove it to continue.'
    : line.exceedsStock
      ? `Only ${line.availableStock} left in stock — quantity reduced to the available amount when you update it.`
      : null;

  const upper = Math.max(1, line.availableStock);
  const optionCount = Math.max(Math.min(upper, MAX_QTY_OPTIONS), line.quantity);
  const quantityOptions = Array.from({ length: optionCount }, (_, i) => i + 1);

  const handleQuantity = (next: number) => {
    const result = setQuantity(line.productId, line.variantId, next, { silent: true });
    if (result.status === 'clamped' && result.message) {
      toast.warning(result.message, { id: `cart-qty-${line.key}` });
    } else if ((result.status === 'out_of_stock' || result.status === 'invalid') && result.message) {
      toast.error(result.message, { id: `cart-qty-${line.key}` });
    }
  };

  const moveToWishlist = () => {
    wishlist.add(line.productId, { silent: true });
    removeItem(line.productId, line.variantId, { silent: true });
    toast.success('Moved to wishlist', {
      id: 'cart-move',
      description: line.name,
      action: { label: 'View wishlist', href: '/wishlist' },
    });
  };

  return (
    <li className="relative rounded-sm border border-line bg-white p-3 sm:p-4 animate-fade-in">
      <button
        type="button"
        onClick={() => removeItem(line.productId, line.variantId)}
        aria-label={`Remove ${line.name} from bag`}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
      >
        <CloseIcon />
      </button>

      <div className="flex gap-3 sm:gap-4">
        <Link
          href={href}
          className="relative aspect-[3/4] w-[90px] shrink-0 overflow-hidden rounded-sm bg-surface sm:w-[110px]"
          aria-label={line.name}
        >
          {line.image ? (
            <FadeImage src={line.image} alt={line.name} fill sizes="110px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-4">No image</div>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col pr-6">
          <Link href={href} className="block truncate text-[14px] font-bold text-ink hover:text-brand">
            {line.brand || line.categoryName}
          </Link>
          <Link href={href} className="block truncate text-[14px] text-ink-2 hover:text-ink">
            {line.name}
          </Link>
          {line.variantLabel && <p className="mt-0.5 text-[12px] text-ink-3">{line.variantLabel}</p>}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <label htmlFor={qtyId} className="text-[12px] font-bold text-ink">
              Qty:
            </label>
            <select
              id={qtyId}
              value={line.quantity}
              disabled={line.isOutOfStock}
              onChange={(event) => handleQuantity(Number(event.target.value))}
              aria-label={`Quantity for ${line.name}`}
              className="h-8 rounded-sm border border-line-strong bg-white px-2 text-[13px] font-bold text-ink focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-4"
            >
              {quantityOptions.map((qty) => (
                <option key={qty} value={qty}>
                  {qty}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5 text-[14px]">
            <span className="font-bold tabular-nums text-ink">{formatPrice(line.lineTotal)}</span>
            {mrpTotal !== null && <span className="text-[12px] tabular-nums text-ink-4 line-through">{formatPrice(mrpTotal)}</span>}
            {percentOff > 0 && <span className="text-[12px] font-medium text-discount">({percentOff}% OFF)</span>}
            {line.quantity > 1 && <span className="text-[12px] text-ink-3">· {formatPrice(line.unitPrice)} each</span>}
          </p>

          {stockNote && (
            <p role="alert" className="mt-2 rounded-sm bg-brand-light px-2.5 py-1.5 text-[12px] font-medium text-brand">
              {stockNote}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-line pt-2.5">
        <button
          type="button"
          onClick={moveToWishlist}
          className="inline-flex items-center gap-1.5 rounded-sm text-[12px] font-bold uppercase tracking-wide text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <HeartIcon />
          Move to wishlist
        </button>
      </div>
    </li>
  );
}

export default CartLineItem;
