import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/api';
import CategoryCard from '@/components/CategoryCard';
import ProductCard from '@/components/ProductCard';

export default async function HomePage() {
  const [categories, featured, popular] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, pageSize: 8 }),
    getProducts({ sort: 'popularity', pageSize: 8 }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/30 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-indigo-400/10 blur-[100px]"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <span className="animate-fade-in-up rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/10">
            New season, new essentials
          </span>
          <h1
            className="max-w-2xl animate-fade-in-up text-4xl font-bold tracking-tight text-white sm:text-5xl"
            style={{ animationDelay: '80ms' }}
          >
            Everyday products, thoughtfully curated.
          </h1>
          <p
            className="max-w-xl animate-fade-in-up text-base text-white/70 sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            Shop electronics, fashion, home goods, beauty, and outdoor gear — all in one place,
            with fast shipping and easy returns.
          </p>
          <Link
            href="/products"
            className="animate-fade-in-up rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-150 hover:bg-brand hover:text-white active:scale-95"
            style={{ animationDelay: '240ms' }}
          >
            Shop All Products
          </Link>
        </div>
      </section>

      {/* Promo strip */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-200 px-4 py-6 text-center text-sm text-slate-600 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          <div className="py-2 sm:py-0">🚚 Free shipping on orders over $50</div>
          <div className="py-2 sm:py-0">↩️ 30-day hassle-free returns</div>
          <div className="py-2 sm:py-0">🔒 Secure checkout, every time</div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Shop by Category</h2>
            <Link href="/products" className="text-sm font-medium text-slate-600 transition-colors hover:text-brand">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <CategoryCard category={cat} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.data.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Featured Products</h2>
            <Link
              href="/products?featured=true"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-brand"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.data.map((product, idx) => (
              <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular products */}
      {popular.data.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Popular Right Now</h2>
            <Link
              href="/products?sort=popularity"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-brand"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {popular.data.map((product, idx) => (
              <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900 sm:text-2xl">What Customers Say</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TESTIMONIALS.map((t, idx) => (
              <blockquote
                key={t.name}
                className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5 transition-shadow duration-300 hover:shadow-md"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <p className="text-sm text-slate-600">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-3 text-sm font-medium text-slate-900">{t.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const TESTIMONIALS = [
  { name: 'Priya S.', quote: 'Fast delivery and the product quality was exactly as described.' },
  { name: 'Marcus T.', quote: 'Great selection and the checkout was refreshingly simple.' },
  { name: 'Elena R.', quote: 'Customer support helped me track my order without any hassle.' },
];
