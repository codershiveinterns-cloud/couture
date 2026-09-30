import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

/**
 * Content-Security-Policy.
 *
 * Next.js App Router streams its React payload through inline `<script>` tags and
 * next/font + Tailwind emit inline `<style>` blocks, so without per-request nonces
 * (which need `proxy.ts` + fully dynamic rendering) `'unsafe-inline'` is required for
 * both script-src and style-src. `'unsafe-eval'` is only added in development, where
 * React's error overlay / source-map tooling relies on it. Everything else is locked
 * to the site's own origin plus the one image CDN the catalog uses.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  // Browsers ignore HSTS over plain http, so this is inert in dev and active in prod.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
];

/** Private / transactional routes: never indexed, regardless of any page-level metadata. */
const NOINDEX_SOURCES = [
  '/admin',
  '/admin/:path*',
  '/api/:path*',
  '/cart',
  '/checkout',
  '/checkout/:path*',
  '/account',
  '/account/:path*',
  '/wishlist',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Catalog images are immutable Unsplash URLs; keep optimised variants for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [36, 56, 72, 110, 160, 220, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      ...NOINDEX_SOURCES.map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ];
  },
};

export default nextConfig;
