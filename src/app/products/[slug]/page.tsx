import type { Metadata } from 'next';
import { getProductBySlug, getRelatedProducts } from '@/lib/api';
import LiveProductDetail from '@/components/storefront/LiveProductDetail';
import { breadcrumbJsonLd, pageMetadata, productBreadcrumbs, productJsonLd, serializeJsonLd, truncateDescription } from '@/lib/seo';

// Render per-request so catalog changes show without a rebuild.
export const dynamic = 'force-dynamic';

const titleFromSlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .slice(0, 80);

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  // Unknown slugs may be admin-created products that only exist in the browser catalog
  // (see LiveProductDetail), so give them a readable title and keep them out of search indexes.
  if (!product) return { title: titleFromSlug(slug) || 'Product', robots: { index: false, follow: true } };
  const title = product.brand ? `${product.name} — ${product.brand}` : product.name;
  return pageMetadata({
    title,
    // The seeded shortDescription is often just "Brand · Category"; prefer the long copy when it is that terse.
    description: truncateDescription(
      product.shortDescription && product.shortDescription.length >= 60 ? product.shortDescription : product.description,
    ),
    path: `/products/${product.slug}`,
    images: product.images.slice(0, 1).map((img) => img.url),
  });
}

export default async function ProductDetailPage({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  // Server render = base catalog. No notFound() here: admin-created products live in
  // localStorage, so LiveProductDetail resolves unknown slugs after hydration and only
  // then shows the not-found panel.
  const product = await getProductBySlug(slug);
  const related = product ? await getRelatedProducts(slug) : [];

  const jsonLd = product ? serializeJsonLd([productJsonLd(product), breadcrumbJsonLd(productBreadcrumbs(product))]) : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      <LiveProductDetail slug={slug} product={product} related={related} />
    </>
  );
}
