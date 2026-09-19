import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/api';
import { COUPONS } from '@/lib/coupons';
import ProductGallery from '@/components/ProductGallery';
import ProductActions from '@/components/ProductActions';
import ProductCard from '@/components/ProductCard';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import SimilarRail from './SimilarRail';

const BEST_OFFER_CODES = ['WELCOME10', 'FLAT5'];

function TagIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
      <path d="M3 12V4h8l9 9-8 8-9-9z" strokeLinejoin="round" />
      <circle cx="7.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Render per-request so catalog changes show without a rebuild.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: product.name,
    description: product.shortDescription || product.description.slice(0, 150),
  };
}

export default async function ProductDetailPage({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(slug);
  const brandLabel = product.brand || product.category?.name || 'Couture';
  const offers = BEST_OFFER_CODES.map((code) => COUPONS.find((c) => c.code === code)).filter(
    (c): c is (typeof COUPONS)[number] => c !== undefined,
  );

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
        <ProductGallery images={product.images} name={product.name} />

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
              productId={product.id}
              basePrice={product.price}
              compareAtPrice={product.compareAtPrice}
              stock={product.stock}
              variants={product.variants}
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
              {product.variants.length > 0 && (
                <div>
                  <dt className="text-ink-3">Options</dt>
                  <dd className="mt-0.5 border-b border-line pb-2 font-medium text-ink">
                    {product.variants.length} available
                  </dd>
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
              <div key={p.id} className="w-[62vw] shrink-0 snap-start sm:w-[calc((100%-0.75rem*2)/3)] lg:w-[calc((100%-0.75rem*3)/4)] xl:w-[calc((100%-0.75rem*4)/5)]">
                <ProductCard product={p} />
              </div>
            ))}
          </SimilarRail>
        </section>
      )}
    </div>
  );
}
