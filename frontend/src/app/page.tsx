import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/api';
import CategoryCard from '@/components/CategoryCard';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import FadeImage from '@/components/FadeImage';

export default async function HomePage() {
  const [categories, featured, popular] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, pageSize: 8 }),
    getProducts({ sort: 'popularity', pageSize: 8 }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20 lg:px-8">
          <div className="max-w-xl">
            <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              New season, new essentials
            </span>
            <h1
              className="animate-fade-in-up mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl"
              style={{ animationDelay: '80ms' }}
            >
              Shop things
              <br />
              worth <span className="text-brand">keeping.</span>
            </h1>
            <p
              className="animate-fade-in-up mt-5 max-w-md text-lg text-ink/60"
              style={{ animationDelay: '160ms' }}
            >
              Electronics, fashion, home, beauty, and outdoor gear — curated in one place, with
              fast shipping and easy returns.
            </p>
            <div
              className="animate-fade-in-up mt-8 flex flex-wrap items-center gap-4"
              style={{ animationDelay: '240ms' }}
            >
              <Link
                href="/products"
                className="rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand active:translate-y-0 active:scale-95"
              >
                Shop All Products
              </Link>
              <Link
                href="/products?featured=true"
                className="text-sm font-semibold text-ink/70 transition-colors hover:text-brand"
              >
                View Featured &rarr;
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-ink/10 pt-6">
              {HERO_STATS.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-2xl font-semibold text-ink sm:text-3xl">{s.value}</dd>
                  <p className="mt-0.5 text-xs text-ink/50">{s.label}</p>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden aspect-[4/5] lg:block">
            <div className="absolute inset-0 -right-2 top-0 h-[85%] w-[80%] overflow-hidden rounded-[28px] shadow-2xl shadow-ink/10">
              <FadeImage
                src="https://images.unsplash.com/photo-1555529669-2269763671c0?fm=jpg&q=80&w=1200&auto=format&fit=crop"
                alt="Featured product styling"
                fill
                priority
                sizes="45vw"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 h-[48%] w-[46%] overflow-hidden rounded-[22px] border-4 border-canvas shadow-2xl shadow-ink/15">
              <FadeImage
                src="https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Black_smartphone_in_hand_%28Unsplash%29.jpg/960px-Black_smartphone_in_hand_%28Unsplash%29.jpg"
                alt="Product detail"
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
            <div className="absolute left-3 top-6 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl shadow-ink/10 backdrop-blur">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white">
                ★
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-ink">4.8 / 5.0</p>
                <p className="text-xs text-ink/50">From 500+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-y border-ink/8 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-start gap-2">
              <span className="text-2xl">{f.icon}</span>
              <p className="font-display text-sm font-semibold text-ink">{f.title}</p>
              <p className="text-xs text-ink/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories — bento layout */}
      {categories.length > 0 && (
        <Reveal as="section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Browse</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">Shop by Category</h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-ink/60 transition-colors hover:text-brand">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:grid-rows-2">
            {categories[0] && (
              <div className="col-span-2 row-span-2 sm:col-span-1 lg:col-span-2">
                <CategoryCard category={categories[0]} size="lg" />
              </div>
            )}
            {categories.slice(1).map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </Reveal>
      )}

      {/* Featured products */}
      {featured.data.length > 0 && (
        <Reveal as="section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Curated</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">Featured Products</h2>
            </div>
            <Link
              href="/products?featured=true"
              className="text-sm font-semibold text-ink/60 transition-colors hover:text-brand"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.data.map((product, idx) => (
              <Reveal key={product.id} delay={Math.min(idx, 8) * 50}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </Reveal>
      )}

      {/* Popular products */}
      {popular.data.length > 0 && (
        <Reveal as="section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Trending</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">Popular Right Now</h2>
            </div>
            <Link
              href="/products?sort=popularity"
              className="text-sm font-semibold text-ink/60 transition-colors hover:text-brand"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {popular.data.map((product, idx) => (
              <Reveal key={product.id} delay={Math.min(idx, 8) * 50}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </Reveal>
      )}

      {/* Testimonials */}
      <Reveal as="section" className="border-t border-ink/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Testimonials</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">What Customers Say</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.name}
                className="rounded-2xl border border-ink/8 bg-canvas p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/5"
              >
                <div className="mb-3 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-ink/70">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold text-white">
                    {t.name[0]}
                  </span>
                  <span className="font-display text-sm font-medium text-ink">{t.name}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

const HERO_STATS = [
  { value: '25+', label: 'Curated products' },
  { value: '5', label: 'Categories' },
  { value: '4.8★', label: 'Average rating' },
];

const FEATURES = [
  { icon: '🚚', title: 'Free Shipping', desc: 'On all orders over $50' },
  { icon: '↩️', title: 'Easy Returns', desc: '30 days, no questions asked' },
  { icon: '🔒', title: 'Secure Checkout', desc: 'Your data is always protected' },
  { icon: '💬', title: '24/7 Support', desc: "We're here whenever you need us" },
];

const TESTIMONIALS = [
  { name: 'Priya S.', quote: 'Fast delivery and the product quality was exactly as described.' },
  { name: 'Marcus T.', quote: 'Great selection and the checkout was refreshingly simple.' },
  { name: 'Elena R.', quote: 'Customer support helped me track my order without any hassle.' },
];
