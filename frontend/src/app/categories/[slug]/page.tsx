import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProducts, type ProductQuery } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import SortSelect from '@/components/SortSelect';

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
      <div className="relative h-48 w-full overflow-hidden bg-slate-900 sm:h-64">
        {category.imageUrl && (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="100vw"
            className="object-cover opacity-60"
            priority
          />
        )}
        <div className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-black/70 to-transparent px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{category.name}</h1>
            {category.description && (
              <p className="mt-1 max-w-2xl text-sm text-white/80">{category.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2 text-sm text-slate-500">
          <Link href="/" className="transition-colors hover:text-brand">
            Home
          </Link>{' '}
          /{' '}
          <Link href="/products" className="transition-colors hover:text-brand">
            Shop
          </Link>{' '}
          / <span className="text-slate-700">{category.name}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <span className="text-sm text-slate-500">{result.meta?.total ?? 0} products</span>
          <SortSelect basePath={`/categories/${slug}`} current={sort} />
        </div>

        {result.data.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p className="text-lg font-medium text-slate-700">No products in this category yet</p>
            <Link
              href="/products"
              className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {result.data.map((product, idx) => (
              <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}>
                <ProductCard product={product} />
              </div>
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
