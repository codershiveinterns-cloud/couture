import { getCategories, getProducts } from '@/lib/api';
import Reveal from '@/components/Reveal';
import CouponBanner from '@/components/home/CouponBanner';
import HeroCarousel, { type HeroSlide } from '@/components/home/HeroCarousel';
import DealsStrip from '@/components/home/DealsStrip';
import CategoryGrid from '@/components/home/CategoryGrid';
import DealsRail from '@/components/home/DealsRail';
import FeaturedBento from '@/components/home/FeaturedBento';
import TrendingBrands from '@/components/home/TrendingBrands';
import ProductRail from '@/components/home/ProductRail';
import TrustRow from '@/components/home/TrustRow';
import Testimonials from '@/components/home/Testimonials';
import NewsletterBand from '@/components/home/NewsletterBand';

const HERO_SLIDES: HeroSlide[] = [
  {
    src: 'https://images.unsplash.com/photo-1555529669-2269763671c0?fm=jpg&q=80&w=1200&auto=format&fit=crop',
    alt: 'Model in a new-season outfit',
    eyebrow: 'New season',
    title: 'Dress for the days ahead.',
    subtitle: 'Fresh silhouettes, everyday staples and the pieces you will reach for all season.',
    ctaLabel: 'Shop fashion',
    href: '/categories/fashion',
    secondaryLabel: 'View all',
    secondaryHref: '/products',
  },
  {
    src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
    alt: 'Wireless headphones on a dark surface',
    eyebrow: 'Tech drop',
    title: 'Sound. Screens. Speed.',
    subtitle: 'Headphones, watches and laptops with up to 40% off this week only.',
    ctaLabel: 'Shop electronics',
    href: '/categories/electronics',
    secondaryLabel: 'Featured picks',
    secondaryHref: '/products?featured=true',
  },
  {
    src: 'https://images.unsplash.com/photo-1561715276-a2d087060f1d?fm=jpg&q=80&w=1200&auto=format&fit=crop',
    alt: 'Curated homeware on a shelf',
    eyebrow: 'Home edit',
    title: 'Make room for better.',
    subtitle: 'Kitchen, living and everything in between — hand-picked, fast shipping, easy returns.',
    ctaLabel: 'Shop home',
    href: '/categories/home-and-kitchen',
    secondaryLabel: 'View all',
    secondaryHref: '/products',
  },
];

export default async function HomePage() {
  const [categories, featured, popular] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, pageSize: 8 }),
    getProducts({ sort: 'popularity', pageSize: 8 }),
  ]);

  return (
    <div className="bg-canvas">
      <CouponBanner />

      <div className="pt-3">
        <HeroCarousel slides={HERO_SLIDES} />
      </div>

      <Reveal>
        <DealsStrip />
      </Reveal>

      <Reveal>
        <CategoryGrid categories={categories} />
      </Reveal>

      <Reveal>
        <DealsRail products={featured.data} href="/products?featured=true" />
      </Reveal>

      <Reveal>
        <FeaturedBento />
      </Reveal>

      <Reveal>
        <TrendingBrands products={popular.data} />
      </Reveal>

      <Reveal>
        <ProductRail title="Top Picks" href="/products?sort=popularity" products={popular.data} layout="grid" />
      </Reveal>

      <Reveal>
        <TrustRow />
      </Reveal>

      <Reveal>
        <Testimonials />
      </Reveal>

      <Reveal>
        <NewsletterBand />
      </Reveal>
    </div>
  );
}
