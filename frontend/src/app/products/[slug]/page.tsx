import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import ProductGallery from '@/components/ProductGallery';
import ProductActions from '@/components/ProductActions';
import ProductCard from '@/components/ProductCard';
import StarRating from '@/components/StarRating';
import Reveal from '@/components/Reveal';

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: product.name,
    description: product.shortDescription || product.description.slice(0, 150),
  };
}

const TRUST_BADGES = [
  { icon: '🚚', label: 'Free shipping over $50' },
  { icon: '↩️', label: '30-day easy returns' },
  { icon: '🔒', label: 'Secure checkout' },
];

export default async function ProductDetailPage({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(slug);
  const hasDiscount = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <div className="mx-auto max-w-7xl animate-fade-in-up px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 text-sm text-ink/45">
        <Link href="/" className="transition-colors hover:text-brand">
          Home
        </Link>{' '}
        /{' '}
        {product.category && (
          <>
            <Link href={`/categories/${product.category.slug}`} className="transition-colors hover:text-brand">
              {product.category.name}
            </Link>{' '}
            /{' '}
          </>
        )}
        <span className="text-ink/70">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
        <div className="lg:sticky lg:top-24">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div>
          {product.brand && (
            <span className="text-xs font-semibold uppercase tracking-widest text-brand">{product.brand}</span>
          )}
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.avgRating} reviewCount={product.reviewCount} size="md" />
            <span className="text-sm text-ink/40">SKU: {product.sku}</span>
          </div>

          {hasDiscount && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-ink/40 line-through">
                {formatPrice(product.compareAtPrice as number)}
              </span>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                Save {formatPrice((product.compareAtPrice as number) - product.price)}
              </span>
            </div>
          )}

          {product.shortDescription && (
            <p className="mt-5 text-[15px] leading-relaxed text-ink/60">{product.shortDescription}</p>
          )}

          <div className="mt-7 border-t border-ink/10 pt-7">
            <ProductActions basePrice={product.price} stock={product.stock} variants={product.variants} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 rounded-2xl border border-ink/8 bg-white p-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-ink/8">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-2.5 px-1 sm:justify-center sm:px-3">
                <span className="text-lg">{b.icon}</span>
                <span className="text-xs font-medium text-ink/60">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 max-w-3xl border-t border-ink/10 pt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Product Description</h2>
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink/60">{product.description}</p>
      </div>

      {related.length > 0 && (
        <Reveal className="mt-16 border-t border-ink/10 pt-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p, idx) => (
              <Reveal key={p.id} delay={idx * 50}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
