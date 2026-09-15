import type { CategorySummary } from '@/lib/types';
import CategoryCard from '@/components/CategoryCard';
import SectionTitle from './SectionTitle';

export default function CategoryGrid({ categories }: { categories: CategorySummary[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <SectionTitle title="Shop by Category" href="/products" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  );
}
