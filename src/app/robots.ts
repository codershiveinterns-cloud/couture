import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/checkout',
          '/checkout/',
          '/cart',
          '/account',
          '/account/',
          '/wishlist',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
