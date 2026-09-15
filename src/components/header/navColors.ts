export interface NavColor {
  /** Tailwind text colour class, e.g. `text-nav-men` */
  text: string;
  /** Tailwind border colour class used for the 4px active underline */
  border: string;
  /** Tailwind background colour class */
  bg: string;
}

/**
 * Category slug → nav colour (Myntra: Men / Women / Kids / Home / Beauty).
 * Class names are spelled out in full so Tailwind can pick them up.
 */
const NAV_COLORS: Record<string, NavColor> = {
  electronics: { text: 'text-nav-men', border: 'border-nav-men', bg: 'bg-nav-men' },
  fashion: { text: 'text-nav-women', border: 'border-nav-women', bg: 'bg-nav-women' },
  'home-and-kitchen': { text: 'text-nav-kids', border: 'border-nav-kids', bg: 'bg-nav-kids' },
  'beauty-and-personal-care': { text: 'text-nav-beauty', border: 'border-nav-beauty', bg: 'bg-nav-beauty' },
  'sports-and-outdoors': { text: 'text-nav-home', border: 'border-nav-home', bg: 'bg-nav-home' },
};

/** Fallback colours cycle in the same order for any category not in the map. */
const FALLBACK: NavColor[] = [
  NAV_COLORS.electronics,
  NAV_COLORS.fashion,
  NAV_COLORS['home-and-kitchen'],
  NAV_COLORS['beauty-and-personal-care'],
  NAV_COLORS['sports-and-outdoors'],
];

export const BRAND_COLOR: NavColor = { text: 'text-brand', border: 'border-brand', bg: 'bg-brand' };

export function navColorFor(slug: string, index: number): NavColor {
  return NAV_COLORS[slug] ?? FALLBACK[index % FALLBACK.length];
}

export interface MegaLink {
  href: string;
  label: string;
}

/** Links shown under a category heading in the mega menu (uses existing catalog query params). */
export function megaLinksFor(slug: string): MegaLink[] {
  const base = `/categories/${slug}`;
  return [
    { href: base, label: 'Shop all' },
    { href: `${base}?sort=newest`, label: 'New arrivals' },
    { href: `${base}?sort=rating`, label: 'Top rated' },
    { href: `${base}?sort=popularity`, label: 'Most popular' },
    { href: `${base}?sort=price_asc`, label: 'Price: low to high' },
    { href: `${base}?sort=price_desc`, label: 'Price: high to low' },
  ];
}

export const SHOP_ALL_LINKS: MegaLink[] = [
  { href: '/products', label: 'All products' },
  { href: '/products?sort=newest', label: 'New arrivals' },
  { href: '/products?sort=rating', label: 'Top rated' },
  { href: '/products?sort=popularity', label: 'Most popular' },
  { href: '/products?sort=price_asc', label: 'Price: low to high' },
  { href: '/products?sort=price_desc', label: 'Price: high to low' },
];

/** Approved Unsplash photo ids used for the "Trending in …" tile in the mega menu. */
const FEATURED_IMAGES: Record<string, string> = {
  electronics: 'photo-1505740420928-5e560c06d30e',
  fashion: 'photo-1527016021513-b09758b777bd',
  'home-and-kitchen': 'photo-1581428982868-e410dd047a90',
  'beauty-and-personal-care': 'photo-1613255348289-1407e4f2f980',
  'sports-and-outdoors': 'photo-1599901860904-17e6ed7083a0',
};

const FEATURED_FALLBACK = 'photo-1495105787522-5334e3ffa0ef';

export function featuredImageFor(slug: string | null): string {
  const id = (slug && FEATURED_IMAGES[slug]) || FEATURED_FALLBACK;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=480&q=80`;
}

/** Short nav label used at the `lg` breakpoint ("Home & Kitchen" → "Home"). */
export function shortLabelFor(label: string): string {
  return label.split(/\s+&\s+/)[0];
}

export const POPULAR_SEARCHES = ['Headphones', 'Sneakers', 'Smart Watch', 'Skincare', 'Yoga Mat', 'Coffee Maker'];
