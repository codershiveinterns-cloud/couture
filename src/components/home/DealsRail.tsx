'use client';

import { useRef } from 'react';
import type { ProductSummary } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import SectionTitle from './SectionTitle';
import Countdown from './Countdown';

function ArrowButton({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === 'left' ? 'Scroll deals left' : 'Scroll deals right'}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-sm border border-line-strong bg-white text-ink transition-colors duration-150 hover:border-ink hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** "Deals of the Day": countdown chip + horizontally scrolling product rail. */
export default function DealsRail({ products, href }: { products: ProductSummary[]; href?: string }) {
  const rail = useRef<HTMLUListElement>(null);

  if (products.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <section aria-labelledby="deals-of-the-day-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <SectionTitle title="Deals of the Day" href={href} id="deals-of-the-day-title" aside={<Countdown />} />
        </div>
        <div className="mb-5 hidden shrink-0 items-center gap-2 sm:mb-7 lg:flex">
          <ArrowButton dir="left" onClick={() => scroll(-1)} />
          <ArrowButton dir="right" onClick={() => scroll(1)} />
        </div>
      </div>
      <ul
        ref={rail}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 lg:gap-4"
      >
        {products.map((p) => (
          <li
            key={p.id}
            className="relative w-[62vw] shrink-0 snap-start sm:w-[calc((100%-0.75rem*2)/3)] lg:w-[calc((100%-1rem*3)/4)]"
          >
            {/* Sits under ProductCard's own NEW/BESTSELLER pill (top-2) so the two stack. */}
            <span className="pointer-events-none absolute left-2 top-9 z-10 rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
              Deal
            </span>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
