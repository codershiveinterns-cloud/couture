'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { isPublished, relatedFor, toProductDetail } from '@/lib/api';
import type { ProductDetail, ProductSummary } from '@/lib/types';
import { useCoupons } from '@/hooks/useCoupons';
import ProductGallery from '@/components/ProductGallery';
import ProductActions from '@/components/ProductActions';
import ProductCard from '@/components/ProductCard';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import ProductLoading from '@/app/products/[slug]/loading';
import SimilarRail from '@/app/products/[slug]/SimilarRail';
import { useLiveCatalog } from './useLiveCatalog';

const BEST_OFFER_CODES = ['WELCOME10', 'FLAT5'];

const PRIMARY_LINK =
  'inline-flex h-11 items-center rounded-sm bg-brand px-6 text-[14px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-dark outline-none focus-visible:ring-2 focus-visible:ring-brand/40';
const SECONDARY_LINK =
  'inline-flex h-11 items-center rounded-sm border border-line-strong bg-white px-6 text-[14px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

function TagIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
      <path d="M3 12V4h8l9 9-8 8-9-9z" strokeLinejoin="round" />
      <circle cx="7.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export interface LiveProductDetailProps {
  slug: string;
  /** Server-rendered product from the base catalog; null when the server does not know the slug. */
  product: ProductDetail | null;
  related: ProductSummary[];
}

type Resolved =
  | { state: 'ready'; product: ProductDetail; related: ProductSummary[] }
  | { state: 'unavailable'; name: string | null; categorySlug: string | null }
  | { state: 'not-found' }
  | { state: 'loading' };

/**
 * Product page body. Known base slugs render the server data until the browser catalog is hydrated
 * and has overrides, then the effective product (price, MRP, stock, variants, copy, images) takes over.
 * Unknown slugs (admin-created products) are resolved entirely client-side.
 */
export default function LiveProductDetail({ slug, product: serverProduct, related: serverRelated }: LiveProductDetailProps) {
  const { isLive, isHydrated, products, publishedProducts } = useLiveCatalog();

  const resolved = useMemo<Resolved>(() => {
    if (!isLive) {
      if (serverProduct) return { state: 'ready', product: serverProduct, related: serverRelated };
      return isHydrated ? { state: 'not-found' } : { state: 'loading' };
    }
    // Base products are matched by id so an admin slug change keeps old links alive.
    const record = serverProduct
      ? products.find((p) => p.id === serverProduct.id)
      : products.find((p) => p.slug === slug);
    if (!record) {
      return serverProduct
        ? { state: 'unavailable', name: serverProduct.name, categorySlug: serverProduct.category?.slug ?? null }
        : { state: 'not-found' };
    }
    if (!isPublished(record)) return { state: 'unavailable', name: record.name, categorySlug: record.categorySlug };
    return { state: 'ready', product: toProductDetail(record), related: relatedFor(publishedProducts, record.slug) };
  }, [isLive, isHydrated, products, publishedProducts, serverProduct, serverRelated, slug]);

  if (resolved.state === 'loading') return <ProductLoading />;
  if (resolved.state === 'not-found') {
    return (
      <StatePanel
        title="We couldn’t find that product"
        description="The link may be broken or the product may have been removed. Keep browsing the full catalogue."
      />
    );
  }
  if (resolved.state === 'unavailable') {
    return (
      <StatePanel
        title="This product is currently unavailable"
        description={
          resolved.name
            ? `${resolved.name} is not available right now. Check back soon or explore similar products.`
            : 'It is not available right now. Check back soon or explore similar products.'
        }
        categorySlug={resolved.categorySlug}
      />
    );
  }

  return <ProductView product={resolved.product} related={resolved.related} live={isLive} />;
}

function StatePanel({ title, description, categorySlug }: { title: string; description: string; categorySlug?: string | null }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:py-24">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink-4" aria-hidden="true">
        <path d="M6 8h12l1 12H5L6 8z" strokeLinejoin="round" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2M9.5 13l5 4M14.5 13l-5 4" strokeLinecap="round" />
      </svg>
      <h1 className="mt-4 text-[20px] font-bold text-ink">{title}</h1>
      <p className="mt-2 max-w-md text-[14px] leading-6 text-ink-3">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/products" className={PRIMARY_LINK}>
          Back to shop
        </Link>
        {categorySlug && (
          <Link href={`/categories/${categorySlug}`} className={SECONDARY_LINK}>
            Similar products
          </Link>
        )}
      </div>
    </div>
  );
}

function ProductView({ product, related, live }: { product: ProductDetail; related: ProductSummary[]; live: boolean }) {
  const { coupons } = useCoupons();
  const offers = BEST_OFFER_CODES.map((code) => coupons.find((c) => c.code === code)).filter(
    (c): c is (typeof coupons)[number] => c !== undefined && c.active,
  );
  const brandLabel = product.brand || product.category?.name || 'Couture';
  // Deactivated variants are not purchasable, so they are not offered.
  const variants = useMemo(() => product.variants.filter((v) => v.isActive), [product.variants]);
  // Remount stateful children when the effective data replaces the server data or is edited.
  const actionsKey = `${product.id}:${live ? 'live' : 'base'}:${variants.map((v) => v.id).join(',')}`;
  const galleryKey = product.images.map((img) => img.url).join('|');

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-[14px] text-ink-2">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="transition-colors hover:text-ink">
              Shop
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/categories/${product.category.slug}`} className="transition-colors hover:text-ink">
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li className="font-bold text-ink" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
        <ProductGallery key={galleryKey} images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-24">
          <h1 className="text-[24px] font-bold leading-tight text-ink">{brandLabel}</h1>
          <p className="mt-1 text-[20px] leading-snug text-ink-2">{product.name}</p>

          <Link
            href="#reviews-heading"
            className="mt-3.5 inline-flex items-center gap-2 rounded-sm border border-line px-2.5 py-1.5 text-[14px] font-bold text-ink transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <span className="flex items-center gap-1">
              {product.avgRating.toFixed(1)}
              <span className="text-rating" aria-hidden="true">
                ★
              </span>
            </span>
            <span className="text-ink-4" aria-hidden="true">
              |
            </span>
            <span className="font-normal text-ink-3">
              {product.reviewCount} {product.reviewCount === 1 ? 'Rating' : 'Ratings'}
            </span>
          </Link>

          <div className="mt-5 border-t border-line pt-5">
            <ProductActions
              key={actionsKey}
              productId={product.id}
              basePrice={product.price}
              compareAtPrice={product.compareAtPrice}
              stock={product.stock}
              variants={variants}
            />
          </div>

          {offers.length > 0 && (
            <section aria-labelledby="best-offers-heading" className="mt-6 border-t border-line pt-6">
              <h2 id="best-offers-heading" className="flex items-center gap-2 text-[16px] font-bold uppercase tracking-wide text-ink">
                Best offers
                <TagIcon className="h-5 w-5 text-ink-2" />
              </h2>
              <ul className="mt-3 space-y-3">
                {offers.map((coupon) => (
                  <li key={coupon.code} className="text-[14px] text-ink-2">
                    <p className="font-bold text-ink">
                      Coupon code: <span className="text-brand">{coupon.code}</span>
                    </p>
                    <p className="mt-0.5">{coupon.description}</p>
                    <p className="mt-0.5 text-[12px] text-ink-3">Applicable on orders over ${coupon.minOrder}. Apply at checkout.</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="product-details-heading" className="mt-6 border-t border-line pt-6">
            <h2 id="product-details-heading" className="text-[16px] font-bold uppercase tracking-wide text-ink">
              Product details
            </h2>
            {product.shortDescription && <p className="mt-3 text-[14px] font-bold text-ink-2">{product.shortDescription}</p>}
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{product.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
              <div>
                <dt className="text-ink-3">SKU</dt>
                <dd className="mt-0.5 border-b border-line pb-2 font-medium text-ink">{product.sku}</dd>
              </div>
              {product.brand && (
                <div>
                  <dt className="text-ink-3">Brand</dt>
                  <dd className="mt-0.5 border-b border-line pb-2 font-medium text-ink">{product.brand}</dd>
                </div>
              )}
              {product.category && (
                <div>
                  <dt className="text-ink-3">Category</dt>
                  <dd className="mt-0.5 border-b border-line pb-2 font-medium text-ink">{product.category.name}</dd>
                </div>
              )}
              {variants.length > 0 && (
                <div>
                  <dt className="text-ink-3">Options</dt>
                  <dd className="mt-0.5 border-b border-line pb-2 font-medium text-ink">{variants.length} available</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>

      <ReviewsSection
        productId={product.id}
        productSlug={product.slug}
        avgRating={product.avgRating}
        reviewCount={product.reviewCount}
      />

      {related.length > 0 && (
        <section aria-labelledby="similar-heading" className="mt-12 border-t border-line pt-8">
          <h2 id="similar-heading" className="text-[16px] font-bold uppercase tracking-wide text-ink sm:text-[18px]">
            Similar products
          </h2>
          <SimilarRail>
            {related.map((p) => (
              <div
                key={p.id}
                className="w-[62vw] shrink-0 snap-start sm:w-[calc((100%-0.75rem*2)/3)] lg:w-[calc((100%-0.75rem*3)/4)] xl:w-[calc((100%-0.75rem*4)/5)]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </SimilarRail>
        </section>
      )}
    </div>
  );
}
