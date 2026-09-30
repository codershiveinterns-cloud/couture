import type { Metadata } from 'next';
import { getCategories, getProducts, parseProductQuery } from '@/lib/api';
import LiveProductGrid from '@/components/storefront/LiveProductGrid';
import { itemListJsonLd, pageMetadata, serializeJsonLd } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Shop All Products',
  description:
    'Browse the full Couture catalogue: electronics, fashion, home, beauty and more. Filter by brand, price, rating, colour and size.',
  path: '/products',
});

// Render per-request so catalog changes show without a rebuild.
export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: PageProps<'/products'>) {
  const sp = await searchParams;
  const query = parseProductQuery(sp);

  // Server render = base catalog. LiveProductGrid re-runs the same query against the
  // admin-edited catalog in the browser (localStorage) once it is hydrated.
  const [categories, result] = await Promise.all([getCategories(), getProducts({ ...query, pageSize: 12 })]);

  const jsonLd = serializeJsonLd(itemListJsonLd(result.data, 'Shop All Products', '/products'));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <LiveProductGrid basePath="/products" searchParams={sp} result={result} categories={categories} />
    </>
  );
}
