'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FocusEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { CategorySummary } from '@/lib/types';
import {
  BRAND_COLOR,
  featuredImageFor,
  megaLinksFor,
  navColorFor,
  POPULAR_SEARCHES,
  SHOP_ALL_LINKS,
  shortLabelFor,
  type NavColor,
} from '@/components/header/navColors';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '@/components/header/icons';
import { useScrolledPast } from '@/components/header/useScrolledPast';
import Logo from '@/components/Logo';

const SHOP_ALL_KEY = '__all__';
const M2_NOTE = 'Coming in Milestone 2';

interface NavItem {
  key: string;
  href: string;
  label: string;
  color: NavColor;
}

export default function Header({ categories }: { categories: CategorySummary[] }) {
  const pathname = usePathname();
  const scrolled = useScrolledPast(8);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openMenu = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(key);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveMenu(null), 150);
  };
  const closeMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(null);
  };

  const navItems: NavItem[] = [
    ...categories.map((cat, index) => ({
      key: cat.slug,
      href: `/categories/${cat.slug}`,
      label: cat.name,
      color: navColorFor(cat.slug, index),
    })),
    { key: SHOP_ALL_KEY, href: '/products', label: 'Shop All', color: BRAND_COLOR },
  ];

  const isNavActive = (item: NavItem) =>
    item.key === SHOP_ALL_KEY ? pathname === '/products' || pathname.startsWith('/products/') : pathname.startsWith(item.href);

  const activeItem = navItems.find((item) => item.key === activeMenu) ?? null;

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ease-out ${
        scrolled ? 'shadow-[0_4px_16px_rgba(40,44,63,0.10)]' : 'shadow-[0_4px_12px_0_rgba(0,0,0,0.05)]'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-20 lg:gap-4 lg:px-6 xl:gap-6 xl:px-8">
        <button
          type="button"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-sm text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MenuIcon open={menuOpen} />
        </button>

        <Logo id="header-mark" markClassName="h-10 w-10 lg:h-11 lg:w-11" className="[&>span]:hidden sm:[&>span]:flex" />

        {/* Desktop nav (categories + Shop All) */}
        <div ref={navRef} className="hidden h-full shrink-0 items-stretch lg:flex" onMouseLeave={scheduleClose}>
          <nav className="flex h-full items-stretch" aria-label="Primary">
            {navItems.map((item) => {
              const active = isNavActive(item);
              const hovered = activeMenu === item.key;
              const short = shortLabelFor(item.label);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onMouseEnter={() => openMenu(item.key)}
                  onFocus={() => openMenu(item.key)}
                  onClick={closeMenu}
                  aria-expanded={hovered}
                  className={`flex items-center whitespace-nowrap border-b-4 border-t-4 border-t-transparent px-1.5 text-[12px] font-bold uppercase tracking-[0.3px] text-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 xl:px-3.5 xl:text-[14px] ${
                    active || hovered ? item.color.border : 'border-b-transparent'
                  }`}
                >
                  {short === item.label ? (
                    item.label
                  ) : (
                    <>
                      <span className="xl:hidden" aria-hidden="true">
                        {short}
                      </span>
                      <span className="hidden xl:inline">{item.label}</span>
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mega dropdown */}
          <div
            className={`absolute left-0 right-0 top-full z-50 transition-opacity duration-150 ${
              activeItem ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onMouseEnter={() => activeItem && openMenu(activeItem.key)}
            onMouseLeave={scheduleClose}
            aria-hidden={!activeItem}
          >
            <div className="border-t border-line bg-white shadow-[0_4px_12px_rgba(40,44,63,0.15)]">
              <div className="mx-auto grid max-w-7xl grid-cols-6 gap-6 px-8 py-7">
                {activeItem?.key === SHOP_ALL_KEY ? (
                  <>
                    <MegaColumn
                      title="Shop All"
                      color={BRAND_COLOR}
                      links={SHOP_ALL_LINKS}
                      highlighted
                      onNavigate={closeMenu}
                      tabbable={Boolean(activeItem)}
                    />
                    {navItems
                      .filter((item) => item.key !== SHOP_ALL_KEY)
                      .slice(0, 4)
                      .map((item) => (
                        <MegaColumn
                          key={item.key}
                          title={item.label}
                          color={item.color}
                          links={megaLinksFor(item.key).slice(0, 4)}
                          onNavigate={closeMenu}
                          tabbable={Boolean(activeItem)}
                        />
                      ))}
                  </>
                ) : (
                  navItems
                    .filter((item) => item.key !== SHOP_ALL_KEY)
                    .slice(0, 5)
                    .map((item) => (
                      <MegaColumn
                        key={item.key}
                        title={item.label}
                        color={item.color}
                        links={item.key === activeItem?.key ? megaLinksFor(item.key) : megaLinksFor(item.key).slice(0, 4)}
                        highlighted={item.key === activeItem?.key}
                        onNavigate={closeMenu}
                        tabbable={Boolean(activeItem)}
                      />
                    ))
                )}
                <FeaturedTile
                  slug={activeItem && activeItem.key !== SHOP_ALL_KEY ? activeItem.key : null}
                  label={activeItem?.label ?? 'Shop All'}
                  href={activeItem?.href ?? '/products'}
                  onNavigate={closeMenu}
                  tabbable={Boolean(activeItem)}
                />
              </div>
            </div>
          </div>
        </div>

        <SearchForm className="ml-auto hidden w-full min-w-[140px] md:block lg:max-w-[220px] xl:max-w-[520px]" />

        {/* Right icon stacks — account, wishlist and bag ship in Milestone 2. */}
        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 lg:gap-2 xl:gap-4">
          <IconStack label="Profile" className="hidden lg:flex">
            <UserIcon />
          </IconStack>
          <IconStack label="Wishlist">
            <HeartIcon />
          </IconStack>
          <IconStack label="Bag">
            <BagIcon />
          </IconStack>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out lg:hidden ${
          menuOpen ? 'grid-rows-[1fr] border-t border-line opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-3">
          <SearchForm className="mb-3" suggestions="inline" onNavigate={() => setMenuOpen(false)} />
          <nav className="flex flex-col text-[14px] text-ink" aria-label="Mobile">
            <p className="mb-1 mt-1 text-[12px] font-bold uppercase tracking-wide text-ink-3">Categories</p>
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 border-b border-line py-3 font-bold uppercase tracking-[0.3px] transition-colors hover:text-brand"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${item.color.bg}`} aria-hidden="true" />
                {item.label}
              </Link>
            ))}
            <p className="mb-1 mt-4 text-[12px] font-bold uppercase tracking-wide text-ink-3">Account</p>
            <p className="py-2 text-[13px] text-ink-3">Login, wishlist and bag arrive in Milestone 2.</p>
          </nav>
        </div>
      </div>
    </header>
  );
}

function SearchForm({
  className = '',
  suggestions = 'popover',
  onNavigate,
}: {
  className?: string;
  /** `popover` floats the popular-searches panel under the input; `inline` renders it in flow (mobile drawer). */
  suggestions?: 'popover' | 'inline';
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const inputId = useId();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = value.trim();
    setOpen(false);
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
    onNavigate?.();
  };

  const handleBlur = (e: FocusEvent<HTMLFormElement>) => {
    // Keep the panel open while focus moves between the input and the chips.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  const pick = () => {
    setOpen(false);
    onNavigate?.();
  };

  const panelId = `${inputId}-popular`;

  return (
    <form
      ref={rootRef}
      role="search"
      onSubmit={handleSubmit}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${suggestions === 'popover' ? 'relative' : ''} ${className}`}
    >
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <div className="flex h-10 items-center rounded-sm border border-surface bg-surface transition-colors focus-within:border-line-strong focus-within:bg-white">
        <span className="flex w-10 shrink-0 items-center justify-center text-ink-3" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          id={inputId}
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search for products, brands and more"
          autoComplete="off"
          aria-controls={panelId}
          className="h-full w-full min-w-0 bg-transparent pr-3 text-[14px] text-ink placeholder:text-ink-4 focus:outline-none"
        />
        <button type="submit" className="sr-only">
          Search
        </button>
      </div>

      {/* Popular searches (static list for Milestone 1; suggestions arrive in Milestone 2). */}
      <div
        id={panelId}
        hidden={!open}
        className={`${
          suggestions === 'popover'
            ? 'absolute left-0 right-0 top-full z-50 mt-1.5 border border-line bg-white p-3 shadow-[0_8px_24px_rgba(40,44,63,0.12)]'
            : 'mt-2'
        } animate-fade-in rounded-sm`}
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">Popular searches</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {POPULAR_SEARCHES.map((term) => (
            <li key={term}>
              <Link
                href={`/products?q=${encodeURIComponent(term)}`}
                onClick={pick}
                tabIndex={open ? 0 : -1}
                className="inline-flex h-7 items-center rounded-full border border-line bg-surface px-3 text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:border-brand hover:bg-brand-light hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {term}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}

function MegaColumn({
  title,
  color,
  links,
  highlighted = false,
  onNavigate,
  tabbable,
}: {
  title: string;
  color: NavColor;
  links: { href: string; label: string }[];
  highlighted?: boolean;
  onNavigate: () => void;
  tabbable: boolean;
}) {
  return (
    <div className={`-mx-3 px-3 py-1 ${highlighted ? 'bg-surface' : ''}`}>
      <h3 className={`mb-2.5 text-[14px] font-bold uppercase tracking-[0.3px] ${color.text}`}>{title}</h3>
      <ul className="space-y-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              tabIndex={tabbable ? 0 : -1}
              onClick={onNavigate}
              className="block rounded-sm text-[14px] text-ink-2 transition-colors hover:font-bold hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Image tile on the right of the mega menu pointing at the hovered category. */
function FeaturedTile({
  slug,
  label,
  href,
  onNavigate,
  tabbable,
}: {
  slug: string | null;
  label: string;
  href: string;
  onNavigate: () => void;
  tabbable: boolean;
}) {
  const caption = slug ? `Trending in ${label}` : 'Trending now';
  return (
    <Link
      href={href}
      tabIndex={tabbable ? 0 : -1}
      onClick={onNavigate}
      aria-label={`${caption} — shop ${label}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-sm bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <Image
        src={featuredImageFor(slug)}
        alt=""
        fill
        sizes="220px"
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-3 pb-3 pt-8">
        <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">Featured</span>
        <span className="mt-0.5 block text-[13px] font-bold leading-tight text-white">{caption}</span>
      </span>
    </Link>
  );
}

/** Milestone 1 placeholder: looks like Myntra's icon stack, but has no destination yet. */
function IconStack({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={`${label} — ${M2_NOTE}`}
      aria-label={`${label} (${M2_NOTE})`}
      className={`relative flex h-10 w-10 cursor-default flex-col items-center justify-center gap-0.5 rounded-sm text-[12px] font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:h-20 lg:w-auto lg:border-b-4 lg:border-t-4 lg:border-b-transparent lg:border-t-transparent lg:px-2 ${className}`}
    >
      {children}
      <span className="hidden leading-none xl:block">{label}</span>
    </button>
  );
}
