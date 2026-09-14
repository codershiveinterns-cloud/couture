import Link from 'next/link';
import type { CategorySummary } from '@/lib/types';
import FadeImage from './FadeImage';

export default function CategoryCard({
  category,
  size = 'sm',
}: {
  category: CategorySummary;
  size?: 'sm' | 'lg';
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={`group relative flex items-end overflow-hidden rounded-2xl bg-ink shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${
        size === 'lg' ? 'h-64 sm:h-full' : 'h-36 sm:h-44'
      }`}
    >
      {category.imageUrl && (
        <FadeImage
          src={category.imageUrl}
          alt={category.name}
          fill
          sizes={size === 'lg' ? '(min-width: 1024px) 40vw, 100vw' : '(min-width: 1024px) 20vw, 50vw'}
          className="object-cover opacity-75 transition-transform duration-700 group-hover:scale-110"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className={`relative z-10 w-full ${size === 'lg' ? 'p-6' : 'p-3.5'}`}>
        <h3 className={`font-display font-semibold text-white ${size === 'lg' ? 'text-2xl' : 'text-sm sm:text-base'}`}>
          {category.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-white/75">
          {typeof category.productCount === 'number' && (
            <span className={size === 'lg' ? 'text-sm' : 'text-xs'}>{category.productCount} products</span>
          )}
          <span
            aria-hidden
            className="translate-x-0 text-white opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
          >
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
