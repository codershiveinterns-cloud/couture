import type { MetadataRoute } from 'next';
import { getCategories, isPublished } from '@/lib/api';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { absoluteUrl } from '@/lib/seo';

// The sitemap lists the published base catalog (the same records `lib/api` serves).
// Admin-created products live only in the browser (localStorage demo data layer) and
// therefore cannot be crawled or listed here.

function safeDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategories().catch(() => []);
  const products = MOCK_PRODUCTS.filter(isPublished);
  const now = new Date();

  // Newest product change doubles as "last modified" for the pages that list the catalog.
  const listingsModified = products.reduce<Date>((latest, p) => {
    const d = safeDate(p.updatedAt ?? p.createdAt, latest);
    return d > latest ? d : latest;
  }, new Date(0));
  const listingsDate = listingsModified.getTime() > 0 ? listingsModified : now;

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: listingsDate, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/products'), lastModified: listingsDate, changeFrequency: 'daily', priority: 0.9 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/categories/${c.slug}`),
    lastModified: listingsDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/products/${p.slug}`),
    lastModified: safeDate(p.updatedAt ?? p.createdAt, listingsDate),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
