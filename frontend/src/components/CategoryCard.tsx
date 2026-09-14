import Link from 'next/link';
import type { CategorySummary } from '@/lib/types';
import FadeImage from './FadeImage';

export default function CategoryCard({ category }: { category: CategorySummary }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative flex h-32 items-end overflow-hidden rounded-xl bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] sm:h-40"
    >
      {category.imageUrl && (
        <FadeImage
          src={category.imageUrl}
          alt={category.name}
          fill
          sizes="(min-width: 1024px) 20vw, 50vw"
          className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-60"
        />
      )}
      <div className="relative z-10 w-full bg-gradient-to-t from-black/70 to-transparent p-3">
        <h3 className="text-sm font-semibold text-white sm:text-base">{category.name}</h3>
        {typeof category.productCount === 'number' && (
          <p className="text-xs text-white/80">{category.productCount} products</p>
        )}
      </div>
    </Link>
  );
}
