import Link from 'next/link';
import type { ProductSummary } from '@/lib/types';
import SectionTitle from './SectionTitle';

export default function TrendingBrands({ products }: { products: ProductSummary[] }) {
  const counts = new Map<string, number>();
  for (const p of products) {
    if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  }
  const brands = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (brands.length === 0) return null;

  return (
    <section aria-labelledby="trending-brands-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <SectionTitle title="Trending Brands" href="/products?sort=popularity" id="trending-brands-title" />
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        {brands.map(([brand, n]) => (
          <li key={brand} className="shrink-0 snap-start">
            <Link
              href={`/products?q=${encodeURIComponent(brand)}`}
              className="flex min-w-[140px] flex-col items-center justify-center rounded-sm border border-line bg-white px-5 py-4 text-center transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_2px_16px_4px_rgba(40,44,63,0.07)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className="text-[16px] font-extrabold uppercase tracking-[0.12em] text-ink">{brand}</span>
              <span className="mt-1 text-[12px] text-ink-3">
                {n} {n === 1 ? 'product' : 'products'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
