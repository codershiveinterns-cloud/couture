import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProducts, type ProductQuery } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import SortSelect from '@/components/SortSelect';
import Reveal from '@/components/Reveal';
import FadeImage from '@/components/FadeImage';

export async function generateMetadata({ params }: PageProps<'/categories/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found' };
  return { title: category.name, description: category.description || undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps<'/categories/[slug]'>) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Number(sp.page) || 1;
  const sort = (typeof sp.sort === 'string' ? sp.sort : undefined) as ProductQuery['sort'];

  const result = await getProducts({ category: slug, page, sort, pageSize: 12 });

  return (
    <div className="animate-fade-in">
      <div className="relative h-56 w-full overflow-hidden bg-ink sm:h-72">
        {category.imageUrl && (
          <FadeImage
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="100vw"
            className="object-cover opacity-55"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-start justify-end px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-light/80">Category</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-white sm:text-4xl">{category.name}</h1>
            {category.description && (
              <p className="mt-2 max-w-2xl text-sm text-white/70">{category.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2 text-sm text-ink/45">
          <Link href="/" className="transition-colors hover:text-brand">
            Home
          </Link>{' '}
          /{' '}
          <Link href="/products" className="transition-colors hover:text-brand">
            Shop
          </Link>{' '}
          / <span className="text-ink/70">{category.name}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          <span className="text-sm text-ink/45">{result.meta?.total ?? 0} products</span>
          <SortSelect basePath={`/categories/${slug}`} current={sort} />
        </div>

        {result.data.length === 0 ? (
          <div className="py-24 text-center text-ink/50">
            <p className="font-display text-lg font-medium text-ink">No products in this category yet</p>
            <Link
              href="/products"
              className="mt-5 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
            >
              Browse All Products
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
          <Pagination meta={result.meta} basePath={`/categories/${slug}`} searchParams={{ sort }} />
        )}
      </div>
    </div>
  );
}
