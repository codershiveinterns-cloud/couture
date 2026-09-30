// SEO helpers: canonical site URL, shared metadata defaults and JSON-LD builders.
// Everything here is pure and safe to import from server components and route files.

import type { Metadata } from 'next';
import type { CategorySummary, ProductDetail, ProductSummary } from './types';

const FALLBACK_SITE_URL = 'http://localhost:3000';

function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (!raw) return FALLBACK_SITE_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return FALLBACK_SITE_URL;
    return url.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

/** Public origin of the deployment, without a trailing slash (from NEXT_PUBLIC_SITE_URL). */
export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = 'Couture';
export const SITE_TAGLINE = 'Online Shopping for Electronics, Fashion, Home & Beauty';
export const SITE_DESCRIPTION =
  'Shop quality electronics, fashion, home, beauty and more at Couture. Fresh drops every week, fast shipping and easy returns.';
export const DEFAULT_LOCALE = 'en_US';
export const CURRENCY = 'USD';
export const TWITTER_HANDLE = '@couture';

/** Absolute URL for a site path (`/products/foo` → `https://example.com/products/foo`). */
export function absoluteUrl(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

/** Trim free-form copy to a meta-description-sized string on a word boundary. */
export function truncateDescription(text: string | null | undefined, max = 155): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Shared canonical + Open Graph + Twitter blocks for a public page. */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  /** Use an absolute title (skip the "| Couture" template). Default: false. */
  absoluteTitle?: boolean;
  type?: 'website' | 'article';
  images?: string[];
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path);
  const images = input.images?.length ? input.images.map((src) => ({ url: src, alt: input.title })) : undefined;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? 'website',
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      url,
      title: input.title,
      description: input.description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      title: input.title,
      description: input.description,
      ...(images ? { images: input.images } : {}),
    },
    ...(input.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

export type JsonLd = Record<string, unknown>;

/**
 * Serialise structured data for a `<script type="application/ld+json">`.
 * `<`, `>` and `&` are escaped to their JSON unicode forms so user-supplied text
 * (product names, descriptions) can never close the script tag or inject HTML.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/apple-icon.png'),
    sameAs: [],
  };
}

export function webSiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(products: readonly ProductSummary[], name: string, path: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: absoluteUrl(path),
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.name,
      ...(p.image ? { image: p.image } : {}),
    })),
  };
}

export function productJsonLd(product: ProductDetail): JsonLd {
  const inStock = product.stock > 0 || product.variants.some((v) => v.isActive && v.stock > 0);
  const images = product.images.map((img) => img.url).filter(Boolean);
  const data: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/products/${product.slug}`)}#product`,
    name: product.name,
    description: truncateDescription(product.shortDescription || product.description, 5000),
    sku: product.sku,
    url: absoluteUrl(`/products/${product.slug}`),
    ...(images.length ? { image: images } : {}),
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: CURRENCY,
      price: product.price.toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  };
  if (product.reviewCount > 0 && product.avgRating > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.avgRating.toFixed(1)),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return data;
}

export function categoryBreadcrumbs(category: Pick<CategorySummary, 'name' | 'slug'>): BreadcrumbItem[] {
  return [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/products' },
    { name: category.name, path: `/categories/${category.slug}` },
  ];
}

export function productBreadcrumbs(product: Pick<ProductDetail, 'name' | 'slug' | 'category'>): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/products' },
  ];
  if (product.category) items.push({ name: product.category.name, path: `/categories/${product.category.slug}` });
  items.push({ name: product.name, path: `/products/${product.slug}` });
  return items;
}
