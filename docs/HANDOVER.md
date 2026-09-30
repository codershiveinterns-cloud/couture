# Couture — Project handover

Milestones 1–4 of the Couture e-commerce platform are delivered as a single Next.js application. This document is the entry point for whoever takes the project forward: what exists, how it is put together, how to run and verify it, and what is still needed before real customers use it.

Companion documents: [ADMIN-GUIDE.md](./ADMIN-GUIDE.md) (using the back office), [DEPLOYMENT.md](./DEPLOYMENT.md) (Vercel, env vars, real payments/email), [TEST-REPORT.md](./TEST-REPORT.md) (final QA), [CROSS-BROWSER.md](./CROSS-BROWSER.md), [CHANGELOG.md](./CHANGELOG.md), and, if present, SECURITY.md / PERFORMANCE.md.

## 1. What the product is

A Myntra-style storefront (white canvas, pink primary, uppercase navigation, squared cards, Figtree at 14px) with:

- **Storefront:** home page (hero, category tiles, deals, top picks, brands, testimonials), catalog with search, filters, sorting and pagination, category pages, product pages with variants and reviews.
- **Customer accounts:** register / login / password reset, profile, addresses, wishlist, bag with coupons, checkout (COD, card, UPI in test mode), order history with a full tracking timeline and self-service cancellation, in-app notifications.
- **Admin area** (`/admin`): dashboard, analytics, products (with variations and images), categories, inventory, orders (status flow, tracking, cancel, refund, COD collection), payments, coupons, customers (block / unblock), reviews moderation, notification outbox, demo-data reset.
- **Platform:** SEO metadata, robots/sitemap, rate-limited JSON API, error boundaries, smoke test, production configuration for Vercel.

## 2. Architecture

```
Browser ──────────────────────────────────────────────────────────────┐
  React 19 client components                                          │
  ├─ src/context/*     Auth, Cart, Wishlist, Toast providers          │
  ├─ src/hooks/*       useCatalog, useOrders, useAllOrders, ...       │  useSyncExternalStore
  └─ src/lib/services/* typed service modules  ── src/lib/storage.ts ─┼─ localStorage (couture:v1:*)
                                                                      │
Next.js 16 App Router (server) ───────────────────────────────────────┘
  src/app/**/page.tsx  server components render the BASE catalog (src/lib/mockData.ts via src/lib/api.ts)
  src/app/api/*        JSON route handlers (same base catalog, rate limited)
  src/components/storefront/*  client wrappers that re-run the server query against the effective catalog
```

Key ideas:

1. **Server pages + live overrides.** `/`, `/products`, `/categories/[slug]` and `/products/[slug]` are server-rendered from the base mock catalog (fast, crawlable). Each page hands its data and the query it used to a client wrapper in `src/components/storefront/` (`LiveHomeSections`, `LiveProductGrid`, `LiveProductDetail`). Once the browser catalog is hydrated *and* contains admin overrides, the wrapper re-runs the same pure query (`queryProducts` in `src/lib/api.ts`) against the effective catalog, so admin edits, new products, stock movements and unpublished items are reflected without a backend. Admin-created products have no server route; their product page is resolved entirely client-side.
2. **localStorage demo data layer.** Everything a customer or admin does is persisted in `localStorage` under keys prefixed `couture:v1:` (`src/lib/storage.ts`). The layer is SSR-safe (no `window` access on the server), tolerant of private mode / quota errors (falls back to an in-memory map), and broadcasts changes across tabs. `JsonStore` + `useSyncExternalStore` give every hook a live, referentially stable snapshot with an `isHydrated` flag so the first client render matches the server HTML.
3. **Service modules are the swap point.** UI code never touches storage directly; it calls typed functions in `src/lib/services/*` that return `ServiceResult<T> = { ok: true; data } | { ok: false; error; fieldErrors? }`. Replacing the implementation of a service with `fetch` calls to a real API leaves every component untouched.
4. **Payments and email are abstracted.** `src/lib/payments/gateway.ts` defines `PaymentGateway { initiate, confirm, cancel }`; the shipped `testGateway` simulates Stripe/Razorpay outcomes. `src/lib/services/notifications.ts` defines `EmailTransport`; the shipped `consoleTransport` logs to the console and the outbox keeps every message.

### Service → backend endpoint map

| Service module (`src/lib/services/`) | Responsibility today (localStorage) | Backend endpoints it maps to |
|---|---|---|
| `auth.ts` | users, salted SHA-256 password hashes, 7-day sessions, reset tokens (30 min), roles (`customer` / `admin`), blocked status, admin seeding | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `PATCH /api/account/profile`, `PATCH /api/account/password` |
| `cart.ts` | per-owner bag (`guest` or user id), stock clamping, coupon evaluation, totals, guest→user merge on login | `GET/PUT /api/cart`, `POST /api/cart/merge` |
| `wishlist.ts` | per-owner wishlist, union on login | `GET/PUT /api/wishlist` |
| `addresses.ts` | per-user address book with default | `GET/POST/PATCH/DELETE /api/addresses` |
| `orders.ts` | order placement (`payAndPlaceOrder`), stock decrement/restore, status flow, tracking, cancel/refund/COD collection, customer + admin queries | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:number`, `POST /api/orders/:number/cancel`; admin: `GET /api/admin/orders`, `PATCH /api/admin/orders/:number/status`, `/tracking`, `/cancel`, `/refund`, `/cod-collected` |
| `payments.ts` + `../payments/gateway.ts` | payment records (brand + last4 only), test gateway | `POST /api/payments/intents`, `POST /api/payments/:id/confirm`, `POST /api/payments/:id/cancel`, provider webhook `POST /api/payments/webhook`; admin `GET /api/admin/payments` |
| `catalogStore.ts` | effective catalog = base + admin overrides: products, variants, images, categories, publish state, stock | admin: `GET/POST/PATCH/DELETE /api/admin/products`, `/api/admin/categories`, `PATCH /api/admin/inventory`; public: existing `GET /api/products`, `/api/products/:slug`, `/api/categories` |
| `coupons.ts` | coupon store (seeded with `WELCOME10`, `FLAT5`, `SUMMER25`), validation, usage counting | `POST /api/coupons/validate`; admin `GET/POST/PATCH/DELETE /api/admin/coupons` |
| `reviews.ts` | one review per user per purchased product, seeded demo reviews, moderation status | `GET/POST /api/products/:slug/reviews`; admin `PATCH/DELETE /api/admin/reviews/:id` |
| `customers.ts` | customer summaries/details, block / unblock | `GET /api/admin/customers`, `GET /api/admin/customers/:id`, `PATCH /api/admin/customers/:id/status` |
| `analytics.ts` | dashboard stats, sales by day / category / payment method, best sellers, demo seeding + reset | `GET /api/admin/analytics?days=` (or a SQL/warehouse job) |
| `notifications.ts` | in-app notifications + email outbox, `EmailTransport` | `GET /api/notifications`, `PATCH /api/notifications/:id/read`; server route `POST /api/email` in front of SendGrid / Resend / SES |
| `crypto.ts` | Web Crypto SHA-256 with pure-JS fallback, random ids | Replaced by server-side bcrypt/argon2 |

Pure helpers that stay as they are when a backend arrives: `src/lib/api.ts` (query engine, DTO mappers), `src/lib/pricing.ts`, `src/lib/coupons.ts` (evaluation), `src/lib/validation.ts`, `src/lib/payments/cards.ts`, `src/lib/safeRedirect.ts`, `src/lib/seo.ts`.

## 3. Folder structure

```
src/app/                 App Router routes (see route list below), layout, error.tsx, loading.tsx, not-found.tsx,
                         robots.ts, sitemap.ts, api/ (JSON handlers), admin/ (admin routes + admin error boundary)
src/components/          Header, Footer, ProductCard, ProductGallery, ProductActions, home/, catalog/ (filters,
                         URL param helpers), storefront/ (live catalog wrappers), auth/, account/, cart/, checkout/,
                         wishlist/, reviews/, notifications/, admin/ (AdminPage primitives, shell, one folder per screen), ui/
src/context/             AuthContext, CartContext, WishlistContext, ToastContext
src/hooks/               useCatalog, useOrders, useAllOrders, useAnalytics, useCoupons, useCustomers, useReviews,
                         useAllReviews, useNotifications, useAddresses, useHydrated, useJsonStore, ...
src/lib/                 mockData (base catalog), api (query engine), catalog, pricing, coupons, validation, format,
                         storage, safeRedirect, seo, rateLimit, payments/ (cards, gateway), services/ (see table)
scripts/smoke.mjs        route smoke test (npm run smoke)
docs/                    this handover set
prisma/                  future database schema scaffold (not used at runtime)
```

Routes: `/`, `/products`, `/products/[slug]`, `/categories/[slug]`, `/cart`, `/wishlist`, `/checkout`, `/checkout/success`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/account`, `/account/profile`, `/account/addresses`, `/account/orders`, `/account/orders/[orderNumber]`, `/account/notifications` (M4), `/admin/login`, `/admin`, `/admin/analytics`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/categories`, `/admin/inventory`, `/admin/orders`, `/admin/orders/[orderNumber]`, `/admin/payments`, `/admin/coupons`, `/admin/customers`, `/admin/customers/[id]`, `/admin/reviews`, `/admin/notifications` (M4), JSON: `/api/products`, `/api/products/[slug]`, `/api/products/[slug]/related`, `/api/categories`, plus `/robots.txt` and `/sitemap.xml`.

## 4. Running and verifying

```bash
npm install
npm run dev            # http://localhost:3000
npm run verify         # eslint + tsc --noEmit + next build  (run before every deploy)
npm run smoke          # requests every route; BASE_URL=https://your-domain npm run smoke against production
```

Individual scripts: `npm run lint`, `npm run typecheck`, `npm run build`, `npm start`. No database or environment variable is required to run; `NEXT_PUBLIC_SITE_URL` should be set in production for correct canonical / Open Graph / sitemap URLs (see DEPLOYMENT.md).

## 5. Credentials and test inputs

| Purpose | Value |
|---|---|
| Admin (auto-created when no admin exists) | `admin@couture.test` / `Admin@12345` |
| Demo customers (created with the demo activity) | `maya.demo@couture.test`, `daniel.demo@couture.test`, `priya.demo@couture.test`, `lucas.demo@couture.test` — password `Demo@12345` |
| Card → success | `4242 4242 4242 4242` (any other Luhn-valid number also succeeds); any future `MM/YY`, 3–4 digit CVC |
| Card → declined | `4000 0000 0000 0002` |
| Card → insufficient funds | `4000 0000 0000 9995` |
| UPI → success / failure | `success@upi` / `fail@upi` |
| Coupons | `WELCOME10` (10 %, min $30, max $25), `FLAT5` ($5, min $20), `SUMMER25` (expired — demonstrates the error path) |
| Password reset | `/forgot-password` shows a demo-mode reset link on screen (no email service); tokens are single-use, 30 minutes |

Pricing rules: free shipping from $50 (otherwise $5.99), 8 % tax, coupon applied before shipping and tax. Low-stock threshold: 5 units.

## 6. Known limitations

- **No backend, database, real payments or email.** All data is per browser (localStorage). Two browsers see different orders, and clearing site data erases everything. "Reset demo data" in the admin dashboard does the same deliberately.
- **Server pages render the base catalog.** Search engines and the JSON API see the 26 seeded products, not admin edits; the sitemap lists the base catalog only. Admin-created products are visible to shoppers in the same browser only.
- **Passwords are hashed client-side (salted SHA-256)** — adequate for a demo, not a substitute for server-side bcrypt/argon2 with a real session mechanism.
- **Rate limiting is per server instance and in memory** (`src/lib/rateLimit.ts`); on Vercel each instance counts separately.
- **Payment flow runs in the browser** (test gateway). A real provider must be integrated server-side (DEPLOYMENT.md, "Connecting a real payment provider").
- **Images** are restricted to `images.unsplash.com` URLs (validated by the catalog store and `next.config.ts`); there is no upload.
- **Single light theme**; the UI does not follow the OS dark mode.

## 7. Roadmap to a production backend

1. **Data model.** Start from `prisma/schema.prisma` (users, products, variants, categories, orders, payments, reviews, coupons, addresses). Add `notifications`.
2. **Auth.** Server sessions (httpOnly cookie or NextAuth), bcrypt/argon2, email verification. Keep `useAuth()`'s surface; reimplement `services/auth.ts` with `fetch`.
3. **Catalog.** Move the base catalog into the database; `src/lib/api.ts` `getProducts`/`getCategories` read from it so server pages, the JSON API and the sitemap show live data, at which point the `Live*` wrappers become unnecessary.
4. **Orders and payments.** `POST /api/orders` re-validates bag, stock and coupon server-side and creates the provider intent; confirm via the provider's hosted UI; mark PAID only after a verified webhook. Implement refunds through the provider.
5. **Email.** Implement `EmailTransport` with a server route holding the provider key; drain the outbox from the server (queue/cron) instead of the browser.
6. **Admin.** Every admin service call becomes an authenticated, role-checked API route; add audit logging and admin-user management.
7. **Ops.** Shared rate-limit store (Upstash/Redis or the CDN), error reporting (Sentry), image uploads (S3/R2 + `next/image` loader), analytics as SQL over orders.
