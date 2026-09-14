import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategories, getProducts, type ProductQuery } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import SortSelect from '@/components/SortSelect';
import Reveal from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Shop All Products',
};

// Live catalog data — render per-request, never at build time.
export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: PageProps<'/products'>) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const category = typeof sp.category === 'string' ? sp.category : undefined;
  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const sort = (typeof sp.sort === 'string' ? sp.sort : undefined) as ProductQuery['sort'];
  const featured = sp.featured === 'true';

  const [categories, result] = await Promise.all([
    getCategories(),
    getProducts({ page, category, q, sort, featured, pageSize: 12 }),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-7xl animate-fade-in-up px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 text-sm text-ink/45">
        <Link href="/" className="transition-colors hover:text-brand">
          Home
        </Link>{' '}
        / <span className="text-ink/70">Shop</span>
        {activeCategory && <span className="text-ink/70"> / {activeCategory.name}</span>}
      </div>

      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {q ? `Search results for "${q}"` : activeCategory ? activeCategory.name : 'All Products'}
      </h1>
      <p className="mt-1.5 text-sm text-ink/50">{result.meta?.total ?? 0} products</p>

      {/* Category filter chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip href="/products" active={!category}>
          All
        </FilterChip>
        {categories.map((cat) => (
          <FilterChip key={cat.id} href={`/products?category=${cat.slug}`} active={category === cat.slug}>
            {cat.name}
          </FilterChip>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
        <span className="text-sm text-ink/45">
          {result.meta ? `Page ${result.meta.page} of ${result.meta.totalPages}` : null}
        </span>
        <SortSelect basePath="/products" current={sort} />
      </div>

      {result.data.length === 0 ? (
        <div className="py-24 text-center text-ink/50">
          <p className="font-display text-lg font-medium text-ink">No products found</p>
          <p className="mt-1 text-sm">Try a different search term or browse all products.</p>
          <Link
            href="/products"
            className="mt-5 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
          >
            View All Products
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {result.data.map((product, idx) => (
            <Reveal key={product.id} delay={Math.min(idx, 8) * 40}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}

      {result.meta && (
        <Pagination
          meta={result.meta}
          basePath="/products"
          searchParams={{ category, q, sort, featured: featured ? 'true' : undefined }}
        />
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? 'border-ink bg-ink text-white shadow-sm'
          : 'border-ink/12 text-ink/60 hover:border-brand/40 hover:text-brand'
      }`}
    >
      {children}
    </Link>
  );
}
