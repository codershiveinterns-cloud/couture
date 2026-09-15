import Link from 'next/link';
import SectionTitle from './SectionTitle';

interface DealTile {
  headline: string;
  big: string;
  category: string;
  slug: string;
  gradient: string;
}

const DEALS: DealTile[] = [
  { headline: 'Min.', big: '40%', category: 'Electronics', slug: 'electronics', gradient: 'from-[#ee5f73] to-[#c9364d]' },
  { headline: 'Flat', big: '30%', category: 'Fashion', slug: 'fashion', gradient: 'from-[#fb56c1] to-[#c22a8f]' },
  { headline: 'Up to', big: '50%', category: 'Home & Kitchen', slug: 'home-and-kitchen', gradient: 'from-[#f26a10] to-[#c04d05]' },
  { headline: 'Buy 2', big: 'GET 1', category: 'Beauty', slug: 'beauty-and-personal-care', gradient: 'from-[#0db7af] to-[#088a84]' },
  { headline: 'Starting', big: '$19', category: 'Sports', slug: 'sports-and-outdoors', gradient: 'from-[#f2c210] to-[#c79a05]' },
];

function suffixFor(tile: DealTile): string {
  if (tile.big.endsWith('%')) return 'OFF';
  if (tile.big === 'GET 1') return 'FREE';
  return 'ONLY';
}

export default function DealsStrip() {
  return (
    <section aria-labelledby="deals-strip-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <SectionTitle title="Biggest Deals" href="/products" id="deals-strip-title" />
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5 lg:gap-4">
        {DEALS.map((tile) => (
          <li key={tile.slug} className="w-[68vw] shrink-0 snap-start sm:w-auto">
            <Link
              href={`/categories/${tile.slug}`}
              className={`group relative flex aspect-[5/4] flex-col justify-between overflow-hidden rounded-sm bg-gradient-to-br ${tile.gradient} p-4 text-white transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_-8px_rgba(40,44,63,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:p-5`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 transition-transform duration-300 ease-out group-hover:scale-125"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/85">{tile.headline}</span>
              <span className="block">
                <span className="block text-[44px] font-extrabold leading-none tracking-tight sm:text-[52px] lg:text-[48px] xl:text-[56px]">
                  {tile.big}
                </span>
                <span className="mt-1 block text-[18px] font-extrabold uppercase leading-none tracking-wide">
                  {suffixFor(tile)}
                </span>
              </span>
              <span className="flex items-center justify-between text-[12px] font-bold uppercase tracking-[0.15em] text-white/90">
                {tile.category}
                <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                  &rarr;
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
