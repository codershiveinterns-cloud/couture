import type { Metadata } from 'next';
import { getCategories, getProducts, parseProductQuery } from '@/lib/api';
import LiveProductGrid from '@/components/storefront/LiveProductGrid';

export const metadata: Metadata = {
  title: 'Shop All Products',
};

// Render per-request so catalog changes show without a rebuild.
export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: PageProps<'/products'>) {
  const sp = await searchParams;
  const query = parseProductQuery(sp);

  // Server render = base catalog. LiveProductGrid re-runs the same query against the
  // admin-edited catalog in the browser (localStorage) once it is hydrated.
  const [categories, result] = await Promise.all([getCategories(), getProducts({ ...query, pageSize: 12 })]);

  return <LiveProductGrid basePath="/products" searchParams={sp} result={result} categories={categories} />;
}
