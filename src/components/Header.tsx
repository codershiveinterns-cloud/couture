'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { CategorySummary } from '@/lib/types';
import { buildLoginHref, buildRegisterHref } from '@/lib/safeRedirect';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import SearchAutocomplete from '@/components/catalog/SearchAutocomplete';
import {
  BRAND_COLOR,
  featuredImageFor,
  megaLinksFor,
  navColorFor,
  SHOP_ALL_LINKS,
  shortLabelFor,
  type NavColor,
} from '@/components/header/navColors';
import { BagIcon, HeartIcon, MenuIcon, UserIcon } from '@/components/header/icons';
import { useScrolledPast } from '@/components/header/useScrolledPast';
import Logo from '@/components/Logo';
import NotificationBell from '@/components/notifications/NotificationBell';

const SHOP_ALL_KEY = '__all__';
const PROTECTED_PREFIXES = ['/account', '/checkout'];

const ACCOUNT_LINKS = [
  { href: '/account', label: 'Profile' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/notifications', label: 'Notifications' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/wishlist', label: 'Wishlist' },
];

interface NavItem {
  key: string;
  href: string;
  label: string;
  color: NavColor;
}

export default function Header({ categories }: { categories: CategorySummary[] }) {
  const pathname = usePathname();
  const scrolled = useScrolledPast(8);
  const { user, status, logout, isAdmin } = useAuth();
  const { itemCount, isHydrated: cartHydrated } = useCart();
  const { count: wishlistCount, isHydrated: wishlistHydrated } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useOnClickOutside(accountRef, () => setAccountOpen(false), accountOpen);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setAccountOpen(false);
      }
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

  const closeAll = () => {
    setMenuOpen(false);
    setAccountOpen(false);
    closeMenu();
  };

  const handleLogout = () => {
    closeAll();
    const onProtectedPage = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    logout(onProtectedPage ? { redirectTo: '/' } : undefined);
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
  const isAuthenticated = status === 'authenticated' && user !== null;
  const firstName = user?.name.trim().split(/\s+/)[0] || 'Account';
  const showWishlistBadge = wishlistHydrated && wishlistCount > 0;
  const showCartBadge = cartHydrated && itemCount > 0;
  const menuTab = accountOpen ? 0 : -1;

  // The admin area ships its own chrome.
  if (pathname.startsWith('/admin')) return null;

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
                  className={`flex items-center whitespace-nowrap border-b-4 border-t-4 border-t-transparent px-2 text-[12px] font-bold uppercase tracking-[0.3px] text-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 xl:px-3 xl:text-[13px] 2xl:text-[14px] ${
                    active || hovered ? item.color.border : 'border-b-transparent'
                  }`}
                >
                  {short === item.label ? (
                    item.label
                  ) : (
                    <span title={item.label} aria-label={item.label}>
                      {short}
                    </span>
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

        <SearchAutocomplete
          className="ml-auto hidden w-full min-w-0 flex-1 md:block lg:max-w-[220px] xl:max-w-[360px] 2xl:max-w-[480px]"
          placeholder="Search for products, brands and more"
        />

        {/* Right icon stacks */}
        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 lg:gap-2 xl:gap-4">
          <div ref={accountRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              aria-controls="account-menu"
              aria-label={isAuthenticated ? `Account menu for ${firstName}` : 'Account'}
              className={`flex h-20 flex-col items-center justify-center gap-0.5 border-b-4 border-t-4 border-t-transparent px-2 text-[12px] font-bold text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 ${
                accountOpen || pathname.startsWith('/account') ? 'border-b-brand' : 'border-b-transparent'
              }`}
            >
              <UserIcon />
              <span className="hidden max-w-[5rem] truncate leading-none xl:block">{isAuthenticated ? firstName : 'Profile'}</span>
            </button>

            <div
              className={`absolute right-0 top-full z-50 w-[300px] pt-1 transition-opacity duration-150 ${
                accountOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <div
                id="account-menu"
                role="menu"
                aria-hidden={!accountOpen}
                className="rounded-sm border border-line bg-white shadow-[0_4px_12px_rgba(40,44,63,0.15)]"
              >
                {status === 'loading' ? (
                  <div className="space-y-2 p-4" aria-hidden="true">
                    <div className="h-4 w-2/3 animate-pulse rounded-sm bg-surface" />
                    <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface" />
                  </div>
                ) : isAuthenticated ? (
                  <>
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-[14px] font-bold text-ink">Hello, {firstName}</p>
                      <p className="truncate text-[12px] text-ink-3">{user.email}</p>
                    </div>
                    <div className="py-1.5">
                      {ACCOUNT_LINKS.map((link) => (
                        <MenuLink key={link.href} href={link.href} onClick={closeAll} tabIndex={menuTab}>
                          {link.label}
                        </MenuLink>
                      ))}
                      {isAdmin && (
                        <MenuLink href="/admin" onClick={closeAll} tabIndex={menuTab}>
                          Admin
                        </MenuLink>
                      )}
                    </div>
                    <div className="border-t border-line py-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        tabIndex={menuTab}
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-left text-[14px] text-ink-2 transition-colors hover:bg-surface hover:font-bold hover:text-ink focus-visible:outline-none focus-visible:bg-surface"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 pb-3 pt-3.5">
                      <p className="text-[14px] font-bold text-ink">Welcome</p>
                      <p className="mt-0.5 text-[13px] text-ink-2">To access account and manage orders</p>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={buildLoginHref()}
                          role="menuitem"
                          tabIndex={menuTab}
                          onClick={closeAll}
                          className="inline-flex h-9 items-center justify-center rounded-sm border border-line-strong px-4 text-[13px] font-bold uppercase text-brand transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          Login
                        </Link>
                        <Link
                          href={buildRegisterHref()}
                          role="menuitem"
                          tabIndex={menuTab}
                          onClick={closeAll}
                          className="inline-flex h-9 items-center justify-center rounded-sm border border-line-strong px-4 text-[13px] font-bold uppercase text-brand transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          Signup
                        </Link>
                      </div>
                    </div>
                    <div className="border-t border-line py-1.5">
                      <MenuLink href="/account/orders" onClick={closeAll} tabIndex={menuTab}>
                        Orders
                      </MenuLink>
                      <MenuLink href="/wishlist" onClick={closeAll} tabIndex={menuTab}>
                        Wishlist
                      </MenuLink>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <NotificationBell />

          <IconStack
            href="/wishlist"
            label="Wishlist"
            active={pathname.startsWith('/wishlist')}
            badge={showWishlistBadge ? wishlistCount : null}
          >
            <HeartIcon />
          </IconStack>

          <IconStack href="/cart" label="Bag" active={pathname.startsWith('/cart')} badge={showCartBadge ? itemCount : null}>
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
          <SearchAutocomplete
            className="mb-3"
            placeholder="Search for products, brands and more"
            onNavigate={() => setMenuOpen(false)}
          />
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
            {status === 'loading' ? (
              <div className="my-3 h-4 w-1/3 animate-pulse rounded-sm bg-surface" aria-hidden="true" />
            ) : isAuthenticated ? (
              <>
                <p className="py-2 text-[13px] text-ink-2">
                  Hello, <span className="font-bold text-ink">{firstName}</span>
                </p>
                {ACCOUNT_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="border-b border-line py-3 text-ink-2 transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="border-b border-line py-3 text-ink-2 transition-colors hover:text-ink">
                    Admin
                  </Link>
                )}
                <Link href="/cart" onClick={() => setMenuOpen(false)} className="border-b border-line py-3 text-ink-2 transition-colors hover:text-ink">
                  Bag
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-3 text-left text-[13px] font-bold uppercase text-brand transition-colors hover:text-brand-dark"
                >
                  Logout ({firstName})
                </button>
              </>
            ) : (
              <>
                <div className="flex gap-2 py-2">
                  <Link
                    href={buildLoginHref()}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-sm bg-brand text-[13px] font-bold uppercase text-white transition-colors hover:bg-brand-dark"
                  >
                    Login
                  </Link>
                  <Link
                    href={buildRegisterHref()}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-sm border border-line-strong text-[13px] font-bold uppercase text-ink transition-colors hover:border-ink"
                  >
                    Signup
                  </Link>
                </div>
                <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="border-b border-line py-3 text-ink-2 transition-colors hover:text-ink">
                  Wishlist
                </Link>
                <Link href="/cart" onClick={() => setMenuOpen(false)} className="py-3 text-ink-2 transition-colors hover:text-ink">
                  Bag
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
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

function IconStack({
  href,
  label,
  active,
  badge,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  badge: number | null;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={badge ? `${label} (${badge})` : label}
      className={`relative flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-sm text-[12px] font-bold text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:h-20 lg:w-auto lg:rounded-none lg:border-b-4 lg:border-t-4 lg:border-t-transparent lg:px-2 lg:hover:bg-transparent lg:focus-visible:ring-inset ${
        active ? 'lg:border-b-brand' : 'lg:border-b-transparent'
      }`}
    >
      <span className="relative">
        {children}
        {badge !== null && (
          <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] animate-fade-in items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className="hidden leading-none xl:block">{label}</span>
    </Link>
  );
}

function MenuLink({
  href,
  onClick,
  tabIndex,
  children,
}: {
  href: string;
  onClick: () => void;
  tabIndex: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      tabIndex={tabIndex}
      onClick={onClick}
      className="flex items-center px-4 py-2 text-[14px] text-ink-2 transition-colors hover:bg-surface hover:font-bold hover:text-ink focus-visible:outline-none focus-visible:bg-surface"
    >
      {children}
    </Link>
  );
}
