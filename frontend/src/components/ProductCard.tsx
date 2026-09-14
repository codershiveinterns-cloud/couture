import Link from 'next/link';
import type { ProductSummary } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import StarRating from './StarRating';
import FadeImage from './FadeImage';

export default function ProductCard({ product }: { product: ProductSummary }) {
  const hasDiscount =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60 active:scale-[0.98]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {product.image ? (
          <FadeImage
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            No image
          </div>
        )}

        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
            -{discountPct}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 py-1 text-center text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.category && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-slate-900 transition-colors group-hover:text-brand">
          {product.name}
        </h3>
        <StarRating rating={product.avgRating} reviewCount={product.reviewCount} />
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-semibold text-slate-900">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.compareAtPrice as number)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
