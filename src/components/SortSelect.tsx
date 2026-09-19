'use client';

import { SORT_OPTIONS } from '@/components/catalog/catalogParams';
import { useCatalogParams } from '@/components/catalog/useCatalogParams';
import { isProductSort } from '@/lib/api';

export default function SortSelect({
  basePath,
  current,
  className = '',
}: {
  basePath: string;
  current?: string;
  className?: string;
}) {
  const { filters, update } = useCatalogParams(basePath);
  const value = isProductSort(current) ? current : filters.sort;

  const onChange = (next: string) => {
    if (isProductSort(next)) update({ sort: next }); // update() resets to page 1
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
