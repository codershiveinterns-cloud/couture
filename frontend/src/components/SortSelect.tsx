'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popularity', label: 'Most Popular' },
];

export default function SortSelect({ basePath, current }: { basePath: string; current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    params.delete('page');
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort" className="text-slate-500">
        Sort by
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={current || 'newest'}
        onChange={handleChange}
        className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none transition-colors hover:border-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
