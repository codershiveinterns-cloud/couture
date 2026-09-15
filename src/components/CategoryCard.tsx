import Link from 'next/link';
import type { CategorySummary } from '@/lib/types';
import FadeImage from './FadeImage';

// Per-category accent, mirroring the header nav underline colors.
const CATEGORY_COLOR: Record<string, string> = {
  electronics: 'bg-nav-men',
  fashion: 'bg-nav-women',
  'home-and-kitchen': 'bg-nav-kids',
  'beauty-and-personal-care': 'bg-nav-beauty',
  'sports-and-outdoors': 'bg-nav-home',
};

const CATEGORY_OFFER: Record<string, string> = {
  electronics: 'Up to 40% off',
  fashion: 'Min. 30% off',
  'home-and-kitchen': 'Up to 50% off',
  'beauty-and-personal-care': 'Up to 35% off',
  'sports-and-outdoors': 'Up to 45% off',
};

export default function CategoryCard({
  category,
  size = 'sm',
}: {
  category: CategorySummary;
  size?: 'sm' | 'lg';
}) {
  const accent = CATEGORY_COLOR[category.slug] ?? 'bg-brand';
  const offer = CATEGORY_OFFER[category.slug] ?? 'Up to 40% off';

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-sm bg-ink text-white transition-shadow duration-200 hover:shadow-[0_8px_24px_-6px_rgba(40,44,63,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <div className={`relative w-full overflow-hidden bg-surface ${size === 'lg' ? 'aspect-[4/5]' : 'aspect-[3/4]'}`}>
        {category.imageUrl && (
          <FadeImage
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes={size === 'lg' ? '(min-width: 1024px) 40vw, 100vw' : '(min-width: 1024px) 20vw, 50vw'}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
        <span
          aria-hidden
          className={`${accent} absolute left-0 top-3 rounded-r-sm px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white`}
        >
          {offer}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <h3 className="truncate text-[15px] font-bold leading-tight sm:text-[17px]">{category.name}</h3>
          <p className="mt-0.5 text-[13px] font-semibold text-white/85 sm:text-[14px]">{offer}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.15em] sm:text-[12px]">
            Shop Now
            <span aria-hidden className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1">
              &rarr;
            </span>
          </p>
        </div>
      </div>
      <span aria-hidden className={`${accent} h-1 w-full`} />
    </Link>
  );
}
