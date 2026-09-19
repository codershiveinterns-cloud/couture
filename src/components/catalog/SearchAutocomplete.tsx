'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { getAllCategories, getAllProducts } from '@/lib/catalog';
import { productMatchesTerms, tokenizeQuery } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import FadeImage from '@/components/FadeImage';
import { POPULAR_SEARCHES } from '@/components/header/navColors';

export interface SearchAutocompleteProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onNavigate?(): void;
}

type Suggestion =
  | { kind: 'product'; id: string; href: string; name: string; price: number; image: string | null; meta: string }
  | { kind: 'category'; id: string; href: string; name: string; meta: string }
  | { kind: 'all'; id: string; href: string; name: string };

const MAX_PRODUCTS = 5;
const MAX_CATEGORIES = 3;

function searchHref(q: string): string {
  return `/products?q=${encodeURIComponent(q)}`;
}

function buildSuggestions(rawQuery: string): Suggestion[] {
  const q = rawQuery.trim();
  const terms = tokenizeQuery(q);
  if (terms.length === 0) return [];

  const products = getAllProducts()
    .filter((p) => productMatchesTerms(p, terms))
    .slice(0, MAX_PRODUCTS)
    .map<Suggestion>((p) => ({
      kind: 'product',
      id: `product-${p.id}`,
      href: `/products/${p.slug}`,
      name: p.name,
      price: p.price,
      image: p.images[0]?.url ?? null,
      meta: `${p.brand} · ${p.categoryName}`,
    }));

  const categories = getAllCategories()
    .filter((c) => terms.every((t) => c.name.toLowerCase().includes(t)))
    .slice(0, MAX_CATEGORIES)
    .map<Suggestion>((c) => ({
      kind: 'category',
      id: `category-${c.id}`,
      href: `/categories/${c.slug}`,
      name: c.name,
      meta: `${c.productCount} products`,
    }));

  return [...products, ...categories, { kind: 'all', id: 'all', href: searchHref(q), name: q }];
}

export default function SearchAutocomplete({
  className = '',
  placeholder = 'Search for products, brands and more',
  autoFocus = false,
  onNavigate,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [rawActiveIndex, setActiveIndex] = useState(-1);
  const debounced = useDebouncedValue(query, 200);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const suggestions = useMemo(() => buildSuggestions(debounced), [debounced]);
  const hasQuery = query.trim().length > 0;
  const showList = open && hasQuery && suggestions.length > 0;
  const showPopular = open && !hasQuery;
  const activeIndex = rawActiveIndex < suggestions.length ? rawActiveIndex : -1;
  const activeItem = activeIndex >= 0 ? suggestions[activeIndex] : undefined;

  useOnClickOutside(rootRef, () => setOpen(false), open);

  const go = (href: string) => {
    setOpen(false);
    setActiveIndex(-1);
    router.push(href);
    onNavigate?.();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (activeItem) {
      go(activeItem.href);
      return;
    }
    const trimmed = query.trim();
    go(trimmed ? searchHref(trimmed) : '/products');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showList) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!showList) return;
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Home' && showList) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End' && showList) {
      e.preventDefault();
      setActiveIndex(suggestions.length - 1);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form
        onSubmit={submit}
        role="search"
        className="flex h-10 items-center rounded-sm border border-surface bg-surface transition-colors duration-150 focus-within:border-line-strong focus-within:bg-white"
      >
        <button
          type="submit"
          aria-label="Search"
          className="flex h-full w-10 shrink-0 items-center justify-center text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:text-brand"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-activedescendant={activeItem ? `${baseId}-${activeItem.id}` : undefined}
          className="h-full w-full min-w-0 bg-transparent pr-3 text-[14px] text-ink outline-none placeholder:text-ink-4 [&::-webkit-search-cancel-button]:appearance-none"
        />
      </form>

      {/* Popular searches: shown while the input is focused and empty. */}
      <div
        id={`${baseId}-popular`}
        hidden={!showPopular}
        className="absolute left-0 right-0 top-full z-50 mt-1 rounded-sm border border-line bg-white p-3 shadow-[0_4px_12px_rgba(40,44,63,0.15)] animate-fade-in"
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">Popular searches</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {POPULAR_SEARCHES.map((term) => (
            <li key={term}>
              <Link
                href={searchHref(term)}
                tabIndex={showPopular ? 0 : -1}
                onClick={(e) => {
                  e.preventDefault();
                  go(searchHref(term));
                }}
                className="inline-flex h-7 items-center rounded-full border border-line bg-surface px-3 text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:border-brand hover:bg-brand-light hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {term}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <ul
        id={listboxId}
        role="listbox"
        aria-label="Search suggestions"
        hidden={!showList}
        className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-sm border border-line bg-white py-1 shadow-[0_4px_12px_rgba(40,44,63,0.15)] animate-fade-in"
      >
        {suggestions.map((item, index) => {
          const active = index === activeIndex;
          const rowClass = `flex items-center gap-3 px-3 py-2 text-[14px] transition-colors duration-150 ${
            active ? 'bg-surface text-ink' : 'text-ink-2 hover:bg-surface'
          }`;
          return (
            <li
              key={item.id}
              id={`${baseId}-${item.id}`}
              role="option"
              aria-selected={active}
              onMouseEnter={() => setActiveIndex(index)}
              className={item.kind === 'all' && suggestions.length > 1 ? 'mt-1 border-t border-line pt-1' : ''}
            >
              <Link
                href={item.href}
                tabIndex={-1}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.href);
                }}
                className={rowClass}
              >
                {item.kind === 'product' && (
                  <>
                    <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-sm bg-surface">
                      {item.image && <FadeImage src={item.image} alt="" fill sizes="36px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-ink">{item.name}</span>
                      <span className="block truncate text-[12px] text-ink-3">{item.meta}</span>
                    </span>
                    <span className="shrink-0 text-[14px] font-bold text-ink">{formatPrice(item.price)}</span>
                  </>
                )}
                {item.kind === 'category' && (
                  <>
                    <span className="flex h-12 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-light text-brand">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M4 5h16v4H4zM4 15h16v4H4z" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-ink">{item.name}</span>
                      <span className="block text-[12px] text-ink-3">Category · {item.meta}</span>
                    </span>
                  </>
                )}
                {item.kind === 'all' && (
                  <span className="flex items-center gap-2 font-bold text-brand">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    See all results for “{item.name}”
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
