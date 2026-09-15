'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_SORT, isProductSort } from '@/lib/api';
import type { ProductSort } from '@/lib/types';

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: "What's New" },
  { value: 'popularity', label: 'Popularity' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer Rating' },
];

export default function SortSelect({
  basePath,
  current,
  className = '',
}: {
  basePath: string;
  current?: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = isProductSort(current) ? current : DEFAULT_SORT;

  const onChange = (next: string) => {
    if (!isProductSort(next)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', next);
    params.delete('page'); // sorting restarts from the first page
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div
      className={`relative flex h-10 items-center rounded-sm border border-line-strong bg-white text-[14px] text-ink transition-colors duration-150 hover:border-ink focus-within:border-ink ${className}`}
    >
      <label htmlFor="sort" className="shrink-0 whitespace-nowrap pl-3 text-ink-2">
        Sort by :
      </label>
      <select
        id="sort"
        name="sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full cursor-pointer appearance-none bg-transparent pl-1.5 pr-9 font-bold text-ink outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-2"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
