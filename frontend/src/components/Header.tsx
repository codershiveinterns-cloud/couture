'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { CategorySummary } from '@/lib/types';

export default function Header({ categories }: { categories: CategorySummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCategoriesOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const openDropdown = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCategoriesOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setCategoriesOpen(false), 150);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products');
    setMenuOpen(false);
  };

  const navLinkClass = (href: string) => {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return `relative whitespace-nowrap py-1 transition-colors hover:text-brand ${isActive ? 'text-ink' : 'text-ink/60'} after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:rounded-full after:bg-brand after:transition-all after:duration-300 ${
      isActive ? 'after:w-full' : 'after:w-0'
    }`;
  };

  const inCategories = pathname.startsWith('/categories');

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-canvas/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'border-ink/10 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_8px_24px_-16px_rgba(0,0,0,0.15)]' : 'border-transparent'
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center gap-4 px-4 transition-[padding] duration-300 sm:px-6 lg:px-8 ${
          scrolled ? 'py-2.5' : 'py-4'
        }`}
      >
        <button
          type="button"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-ink/5 lg:hidden"
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

        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:bg-brand">
            S
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">Shoply</span>
        </Link>

        <nav className="hidden items-center gap-7 font-display text-[15px] font-medium lg:flex">
          <Link href="/" className={navLinkClass('/')}>
            Home
          </Link>
          <Link href="/products" className={navLinkClass('/products')}>
            Shop All
          </Link>

          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              onClick={() => setCategoriesOpen((v) => !v)}
              aria-expanded={categoriesOpen}
              className={`relative flex items-center gap-1.5 whitespace-nowrap py-1 transition-colors hover:text-brand ${
                inCategories ? 'text-ink' : 'text-ink/60'
              }`}
            >
              Categories
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              className={`absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 transition-all duration-200 ${
                categoriesOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
              }`}
            >
              <div className="overflow-hidden rounded-2xl border border-ink/8 bg-white p-2 shadow-xl shadow-ink/10">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    onClick={() => setCategoriesOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink/75 transition-colors hover:bg-brand-light hover:text-brand"
                  >
                    {cat.name}
                    {typeof cat.productCount === 'number' && (
                      <span className="text-xs text-ink/35">{cat.productCount}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden flex-1 max-w-md sm:flex">
          <div className="relative w-full">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, SKUs..."
              className="w-full rounded-full border border-ink/10 bg-white py-2 pl-4 pr-10 text-sm outline-none transition-all duration-150 placeholder:text-ink/35 focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-brand-light hover:text-brand"
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
        className={`grid overflow-hidden border-ink/10 transition-all duration-300 ease-out lg:hidden ${
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
              className="w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </form>
          <nav className="flex flex-col gap-3 font-display text-sm font-medium text-ink/70">
            <Link href="/" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-brand">
              Home
            </Link>
            <Link href="/products" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-brand">
              Shop All
            </Link>
            <div className="mt-1 border-t border-ink/8 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink/35">Categories</p>
              <div className="flex flex-col gap-3">
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
              </div>
            </div>
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
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-all duration-150 hover:bg-brand-light hover:text-brand active:scale-90"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {children}
      </svg>
      <span className="sr-only">{label}</span>
    </button>
  );
}
