# Changelog

All notable changes per milestone. Dates are the milestone commit dates on `main`.

## Milestone 4 — Final features & production launch (2026-09)

- **Order tracking:** customer order page rebuilt around the full flow Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered with cancelled / refunded states, carrier + tracking number and self-service cancellation before shipment.
- **Transactional notifications:** `services/notifications` records an in-app notification (header bell, `/account/notifications`) and an outbox email for registration, order confirmation, payment, status updates, shipping, delivery, cancellation and refund; admin outbox at `/admin/notifications`; `EmailTransport` abstraction for a real provider.
- **Sales analytics:** period switcher (7 / 14 / 30 days) now drives every panel — best sellers, sales by category, payment split and order status are computed from the same window as the chart, and each panel is labelled with the active period.
- **SEO:** `src/lib/seo.ts` (canonical site URL from `NEXT_PUBLIC_SITE_URL`, shared metadata, JSON-LD builders), `robots.ts`, `sitemap.ts`, Open Graph / Twitter metadata, `noindex` on account and admin pages.
- **Security:** rate limiting on the JSON API (`src/lib/rateLimit.ts`), `.env.example`, secure production configuration — see SECURITY.md.
- **Performance / mobile:** see PERFORMANCE.md; low-stock "Only N left" tag now rendered by `ProductCard` so it is consistent across listing grids, home rails and the similar-products rail.
- **Bug fixes:** admin-created category slugs are no longer dropped from `/products?category=` by the client-side filter parser (`useCatalogParams` validates against the effective catalog); duplicate low-stock tag removed from `LiveProductGrid`.
- **Error boundaries:** themed `src/app/admin/error.tsx` (inside the admin shell) alongside the existing `src/app/error.tsx`.
- **Tooling:** `npm run typecheck`, `npm run smoke` (`scripts/smoke.mjs`, route smoke test with a pass/fail table), `npm run verify` (lint + typecheck + build); `vercel.json` reduced to the Next.js framework preset.
- **Documentation:** `docs/HANDOVER.md`, `ADMIN-GUIDE.md`, `DEPLOYMENT.md`, `TEST-REPORT.md`, `CROSS-BROWSER.md`, this changelog; README updated.

## Milestone 3 — Admin, orders & payments

- Admin area at `/admin` behind role-based access (`RequireAdmin`, `admin` role, blocked accounts); demo admin seeded automatically.
- Dashboard (KPIs, 14-day sales chart, payment split, recent orders / customers, low stock, best sellers), analytics, products (variations, images, publish state, featured, bulk actions), categories, inventory (per-variant stock, restock, CSV), orders (status flow, notes, tracking, cancel, refund, COD collection, CSV), payments ledger, coupons (percentage / fixed, minimum, maximum, expiry, usage limit, active), customers (block / unblock), reviews moderation.
- Effective catalog store (base mock data + admin overrides) surfaced on the storefront through `src/components/storefront/*` and `useCatalog()`.
- Test-mode payment gateway (`src/lib/payments/gateway.ts`) with card / UPI success, decline, insufficient-funds and cancel outcomes; `payAndPlaceOrder` re-validates the bag and decrements stock; card data never persisted (brand + last 4 only).
- Demo activity seeding and "Reset demo data".

## Milestone 2 — Customer shopping experience (2026-09-19)

- Search autocomplete and multi-term search; advanced filters (category, brand, price, rating, stock, colour, size) synced to the URL with active-filter chips and facet counts; sorting.
- Authentication (register, login, logout, forgot / reset password in demo mode), account overview, profile, password change, addresses.
- Wishlist (guest + user), bag with variant lines, stock clamping, coupons, free-shipping progress and price details; checkout stepper with Cash on Delivery; order history and confirmation.
- Reviews: seeded demo reviews plus one review per signed-in purchaser, rating summary and distribution.
- localStorage demo data layer behind typed service modules; SSR-safe stores with `useSyncExternalStore`.

## Milestone 1 — Storefront foundation (2026-09-15)

- Next.js 16 App Router project with Tailwind v4 design tokens (Myntra-style theme) and Figtree.
- Home page (coupon strip, hero carousel, category tiles, deals and top-picks rails, testimonials), header with mega-menu and mobile drawer, footer.
- Product catalog with cards, category chips, sorting and pagination; category pages; product detail page with gallery, variants, quantity stepper and similar products.
- Typed mock catalog (5 categories, 26 products) served through `src/lib/api.ts` and JSON route handlers; Prisma schema scaffold for the future database.
- Vercel-ready configuration.
