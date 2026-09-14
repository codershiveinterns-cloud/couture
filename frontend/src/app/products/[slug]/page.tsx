import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import ProductGallery from '@/components/ProductGallery';
import ProductActions from '@/components/ProductActions';
import ProductCard from '@/components/ProductCard';
import StarRating from '@/components/StarRating';

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
  const hasDiscount = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <div className="mx-auto max-w-7xl animate-fade-in-up px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 text-sm text-slate-500">
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
        <span className="text-slate-700">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          {product.brand && (
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {product.brand}
            </span>
          )}
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-2 flex items-center gap-3">
            <StarRating rating={product.avgRating} reviewCount={product.reviewCount} size="md" />
            <span className="text-sm text-slate-400">SKU: {product.sku}</span>
          </div>

          {hasDiscount && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(product.compareAtPrice as number)}
              </span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                Save {formatPrice((product.compareAtPrice as number) - product.price)}
              </span>
            </div>
          )}

          {product.shortDescription && (
            <p className="mt-4 text-sm text-slate-600">{product.shortDescription}</p>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6">
            <ProductActions basePrice={product.price} stock={product.stock} variants={product.variants} />
          </div>
        </div>
      </div>

      <div className="mt-14 max-w-3xl">
        <h2 className="text-lg font-semibold text-slate-900">Product Description</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {product.description}
        </p>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p, idx) => (
              <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
