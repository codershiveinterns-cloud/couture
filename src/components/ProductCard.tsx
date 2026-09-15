'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ProductSummary } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import StarRating from './StarRating';
import FadeImage from './FadeImage';

const IMAGE_SIZES = '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw';

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5 17.7 5 19.5 8.2 22 11.9 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export default function ProductCard({ product }: { product: ProductSummary }) {
  // Milestone 1 previews the interactions; persistence (cart, wishlist) ships in Milestone 2.
  const [wishlisted, setWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  const quickAdd = () => {
    setJustAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(false), 1100);
  };

  const hasDiscount = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100) : 0;
  const outOfStock = product.stock <= 0;
  const brand = product.brand || product.category?.name || 'Couture';
  const href = `/products/${product.slug}`;
  const badge = product.reviewCount >= 100 ? 'BESTSELLER' : product.isFeatured ? 'NEW' : null;

  const onWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((w) => !w);
  };

  return (
    <article className="group relative flex flex-col bg-white transition-shadow duration-200 hover:z-10 hover:shadow-[0_2px_16px_4px_rgba(40,44,63,0.07)] focus-within:z-10 focus-within:shadow-[0_2px_16px_4px_rgba(40,44,63,0.07)]">
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-surface">
          {product.image ? (
            <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
              <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0">
                <FadeImage src={product.image} alt={product.name} fill sizes={IMAGE_SIZES} className="object-cover" />
              </div>
              {product.hoverImage && (
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <FadeImage src={product.hoverImage} alt="" fill sizes={IMAGE_SIZES} className="object-cover" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-4">No image</div>
          )}

          {badge && (
            <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-bold leading-none tracking-wide text-ink shadow-[0_1px_3px_rgba(40,44,63,0.15)]">
              {badge}
            </span>
          )}

          {product.reviewCount > 0 && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/20 to-transparent"
              />
              <span className="absolute bottom-2 left-2 rounded-sm bg-white/95 px-1.5 py-1 leading-none shadow-[0_1px_3px_rgba(40,44,63,0.12)]">
                <StarRating rating={product.avgRating} reviewCount={product.reviewCount} />
              </span>
            </>
          )}

          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <span className="rounded-sm bg-white px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-ink shadow-[0_1px_3px_rgba(40,44,63,0.2)]">
                Out of stock
              </span>
            </div>
          )}

          {/* Touch devices get no hover state, so keep a heart on the image for them. */}
          <button
            type="button"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wishlisted}
            title="Wishlist syncing arrives in Milestone 2"
            onClick={onWishlist}
            className={`absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-[0_1px_3px_rgba(40,44,63,0.2)] pointer-coarse:flex ${
              wishlisted ? 'text-brand' : 'text-ink-2'
            }`}
          >
            <HeartIcon filled={wishlisted} />
          </button>
        </div>

        <div className="px-2.5 pb-3 pt-2.5">
          <h3 className="truncate text-[16px] font-bold leading-tight text-ink">{brand}</h3>
          <p className="mt-0.5 truncate text-[14px] leading-snug text-ink-2">{product.name}</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 leading-tight">
            <span className="text-[14px] font-bold text-ink">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-[12px] text-ink-4 line-through">{formatPrice(product.compareAtPrice as number)}</span>
                <span className="text-[12px] text-discount">({discountPct}% OFF)</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Hover / focus actions. Positioned below the card so the grid never reflows. */}
      <div className="pointer-events-none absolute inset-x-0 top-full z-10 flex flex-col gap-1.5 bg-white px-2.5 pb-2.5 opacity-0 shadow-[0_12px_16px_0_rgba(40,44,63,0.07)] transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        {!outOfStock && (
          <button
            type="button"
            title="Cart ships in Milestone 2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              quickAdd();
            }}
            className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-sm text-[12px] font-bold uppercase tracking-wide text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              justAdded ? 'bg-success' : 'bg-brand hover:bg-brand-dark'
            }`}
          >
            {justAdded ? (
              <>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Added
              </>
            ) : (
              <>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8h12l1 12H5L6 8z" strokeLinejoin="round" />
                  <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
                </svg>
                Add to bag
              </>
            )}
          </button>
        )}
        <button
          type="button"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          title="Wishlist syncing arrives in Milestone 2"
          onClick={onWishlist}
          className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-sm border text-[12px] font-bold uppercase tracking-wide transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
            wishlisted
              ? 'border-brand bg-brand text-white hover:bg-brand-dark'
              : 'border-line-strong bg-white text-ink hover:border-ink'
          }`}
        >
          <HeartIcon filled={wishlisted} />
          {wishlisted ? 'Wishlisted' : 'Wishlist'}
        </button>
      </div>
    </article>
  );
}
