'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ProductSummary } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import StarRating from './StarRating';
import FadeImage from './FadeImage';

export default function ProductCard({ product }: { product: ProductSummary }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const hasDiscount =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-ink/15 hover:shadow-xl hover:shadow-ink/[0.06] active:scale-[0.98]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
        {product.image ? (
          <>
            <div className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-0">
              <FadeImage
                src={product.image}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
            {product.hoverImage && (
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <FadeImage
                  src={product.hoverImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="scale-105 object-cover"
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/30">No image</div>
        )}

        {hasDiscount && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
            -{discountPct}%
          </span>
        )}

        <button
          type="button"
          aria-label="Toggle wishlist"
          aria-pressed={wishlisted}
          title="Wishlist syncing arrives in Milestone 2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setWishlisted((w) => !w);
          }}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 active:scale-90 ${
            wishlisted
              ? 'bg-rose-500 text-white opacity-100'
              : 'bg-white/80 text-ink/60 opacity-0 hover:text-rose-500 group-hover:opacity-100'
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5 17.7 5 19.5 8.2 22 11.9 19.5 16.4 12 21 12 21z" />
          </svg>
        </button>

        {outOfStock ? (
          <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-1.5 text-center text-xs font-medium text-white">
            Out of stock
          </span>
        ) : (
          <button
            type="button"
            title="Cart ships in Milestone 2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1100);
            }}
            className={`absolute inset-x-2 bottom-2 translate-y-12 rounded-lg py-2 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 ${
              justAdded ? 'bg-emerald-600' : 'bg-ink hover:bg-brand'
            }`}
          >
            {justAdded ? 'Added ✓' : 'Quick Add'}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {product.category && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink/40">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 font-display text-[15px] font-medium leading-snug text-ink transition-colors group-hover:text-brand">
          {product.name}
        </h3>
        <StarRating rating={product.avgRating} reviewCount={product.reviewCount} />
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-semibold text-ink">{formatPrice(product.price)}</span>
          {hasDiscount && (
            <span className="text-sm text-ink/35 line-through">
              {formatPrice(product.compareAtPrice as number)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
