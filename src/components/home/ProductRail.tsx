import type { ProductSummary } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import SectionTitle from './SectionTitle';

/**
 * Horizontal, snap-scrolling rail on mobile; regular grid from `sm` up.
 * Used for the "DEALS OF THE DAY" and "TOP PICKS" homepage sections.
 */
export default function ProductRail({
  title,
  href,
  products,
  layout = 'rail',
}: {
  title: string;
  href?: string;
  products: ProductSummary[];
  layout?: 'rail' | 'grid';
}) {
  if (products.length === 0) return null;

  const listClass =
    layout === 'rail'
      ? '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-3 sm:gap-y-8 sm:overflow-visible sm:px-0 lg:grid-cols-4'
      : 'grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4';

  const itemClass = layout === 'rail' ? 'w-[62vw] shrink-0 snap-start sm:w-auto' : '';

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <SectionTitle title={title} href={href} />
      <ul className={listClass}>
        {products.map((p) => (
          <li key={p.id} className={itemClass}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
