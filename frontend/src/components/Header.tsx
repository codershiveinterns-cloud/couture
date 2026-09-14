'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CategorySummary } from '@/lib/types';

export default function Header({ categories }: { categories: CategorySummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products');
    setMenuOpen(false);
  };

  const navLinkClass = (href: string) => {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return `relative py-1 transition-colors hover:text-brand ${isActive ? 'text-slate-900' : ''} after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-brand after:transition-all after:duration-200 ${
      isActive ? 'after:w-full' : 'after:w-0'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-slate-900 transition-colors hover:text-brand">
          Shoply
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          <Link href="/" className={navLinkClass('/')}>
            Home
          </Link>
          <Link href="/products" className={navLinkClass('/products')}>
            Shop All
          </Link>
          {categories.slice(0, 5).map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`} className={navLinkClass(`/categories/${cat.slug}`)}>
              {cat.name}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden flex-1 max-w-md sm:flex">
          <div className="relative w-full">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, SKUs..."
              className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-4 pr-10 text-sm outline-none transition-all duration-150 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-brand-light hover:text-brand"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-4">
          <IconButton label="Wishlist">
            <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5 17.7 5 19.5 8.2 22 11.9 19.5 16.4 12 21 12 21z" />
          </IconButton>
          <IconButton label="Account">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
          </IconButton>
          <IconButton label="Cart">
            <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
            <path d="M6 6L5 2H2" strokeLinecap="round" />
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
          </IconButton>
        </div>
      </div>

      <div
        className={`grid overflow-hidden border-slate-200 transition-all duration-300 ease-out lg:hidden ${
          menuOpen ? 'grid-rows-[1fr] border-t opacity-100' : 'grid-rows-[0fr] border-t-0 opacity-0'
        }`}
      >
        <div className="min-h-0 px-4 py-3">
          <form onSubmit={handleSearch} className="mb-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </form>
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            <Link href="/" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-brand">
              Home
            </Link>
            <Link href="/products" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-brand">
              Shop All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className="transition-colors hover:text-brand"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={`${label} — coming in Milestone 2`}
      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-all duration-150 hover:bg-brand-light hover:text-brand active:scale-90"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {children}
      </svg>
      <span className="sr-only">{label}</span>
    </button>
  );
}
