import Link from 'next/link';
import FadeImage from '@/components/FadeImage';

interface BentoTile {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  cta: string;
  href: string;
  large?: boolean;
}

const TILES: BentoTile[] = [
  {
    src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80',
    alt: 'Wireless headphones on a dark surface',
    eyebrow: 'Electronics',
    title: 'Sound that moves with you.',
    cta: 'Shop electronics',
    href: '/categories/electronics',
    large: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=900&q=80',
    alt: 'Rail of hanging garments',
    eyebrow: 'Fashion',
    title: 'The new-season edit.',
    cta: 'Shop fashion',
    href: '/categories/fashion',
  },
  {
    src: 'https://images.unsplash.com/photo-1613255348289-1407e4f2f980?auto=format&fit=crop&w=900&q=80',
    alt: 'Skincare bottles arranged on a shelf',
    eyebrow: 'Beauty',
    title: 'Glow, bottled.',
    cta: 'Shop beauty',
    href: '/categories/beauty-and-personal-care',
  },
];

export default function FeaturedBento() {
  return (
    <section aria-label="Featured collections" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:grid-rows-2 lg:gap-4">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`group relative block overflow-hidden rounded-sm bg-ink text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              tile.large ? 'aspect-[4/5] sm:aspect-[16/9] lg:col-span-2 lg:row-span-2 lg:aspect-auto' : 'aspect-[16/9] lg:aspect-auto lg:min-h-[220px]'
            }`}
          >
            <FadeImage
              src={tile.src}
              alt={tile.alt}
              fill
              sizes={tile.large ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, 100vw'}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
            <div className={`absolute inset-x-0 bottom-0 ${tile.large ? 'p-6 sm:p-8 lg:p-10' : 'p-5 sm:p-6'}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/80">{tile.eyebrow}</p>
              <h3
                className={`mt-2 font-extrabold leading-[1.05] tracking-tight ${
                  tile.large ? 'text-[28px] sm:text-[36px] lg:text-[44px]' : 'text-[22px] sm:text-[26px]'
                }`}
              >
                {tile.title}
              </h3>
              <span className="mt-4 inline-flex h-10 items-center gap-2 rounded-sm bg-white px-4 text-[12px] font-bold uppercase tracking-wide text-ink transition-colors duration-150 group-hover:bg-brand group-hover:text-white">
                {tile.cta}
                <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                  &rarr;
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
