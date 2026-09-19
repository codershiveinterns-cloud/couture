'use client';

import Link from 'next/link';
import FadeImage from '@/components/FadeImage';
import { discountPercent } from '@/components/cart/priceUtils';
import { useWishlist } from '@/context/WishlistContext';
import { getDefaultVariant, getEffectivePrice, getProductImage, isProductInStock } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import type { ProductRecord } from '@/lib/mockTypes';

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function WishlistCard({ product }: { product: ProductRecord }) {
  const { remove, moveToCart } = useWishlist();
  const variant = getDefaultVariant(product);
  const price = getEffectivePrice(product, variant);
  const inStock = isProductInStock(product);
  const image = getProductImage(product);
  const href = `/products/${product.slug}`;
  const hasDiscount = product.compareAtPrice !== null && product.compareAtPrice > price;
  const percentOff = discountPercent(price, product.compareAtPrice);

  return (
    <li className="relative flex flex-col overflow-hidden rounded-sm border border-line bg-white transition-shadow duration-200 hover:shadow-[0_2px_16px_4px_rgba(40,44,63,0.07)] animate-fade-in">
      <button
        type="button"
        onClick={() => remove(product.id)}
        aria-label={`Remove ${product.name} from wishlist`}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white/95 text-ink-2 shadow-sm transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
      >
        <CloseIcon />
      </button>

      <Link href={href} className="relative block aspect-[3/4] w-full overflow-hidden bg-surface" aria-label={product.name}>
        {image ? (
          <FadeImage
            src={image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-4">No image</div>
        )}
        {!inStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-sm bg-white px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-ink shadow-sm">Out of stock</span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-2.5 pb-3 pt-2.5">
        <Link href={href} className="truncate text-[14px] font-bold text-ink hover:text-brand">
          {product.brand || product.categoryName}
        </Link>
        <Link href={href} className="truncate text-[13px] text-ink-2 hover:text-ink">
          {product.name}
        </Link>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-[14px] font-bold text-ink">{formatPrice(price)}</span>
          {hasDiscount && <span className="text-[12px] text-ink-4 line-through">{formatPrice(product.compareAtPrice as number)}</span>}
          {percentOff > 0 && <span className="text-[12px] text-discount">({percentOff}% OFF)</span>}
        </p>
      </div>

      <button
        type="button"
        disabled={!inStock}
        onClick={() => moveToCart(product.id)}
        className="h-11 w-full border-t border-line text-[13px] font-bold uppercase tracking-wide text-brand transition-colors hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:text-ink-4 disabled:hover:bg-transparent"
      >
        {inStock ? 'Move to bag' : 'Out of stock'}
      </button>
    </li>
  );
}

export default WishlistCard;
