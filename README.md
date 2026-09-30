# Couture — Modern E-Commerce Platform

Couture is a Myntra-style storefront with a full back office, delivered across four milestones as a single Next.js application that runs with zero configuration locally and on Vercel.

- **Milestone 1** — storefront foundation: home, catalog, category and product pages, responsive Myntra-style design system.
- **Milestone 2** — customer experience: search and filters, accounts, wishlist, bag with coupons, checkout, reviews.
- **Milestone 3** — admin, orders and payments: `/admin` back office, order status flow, test-mode card/UPI payments, coupons, customers, moderation.
- **Milestone 4** — production launch: order tracking, transactional notifications, period-driven analytics, SEO, security and performance work, cross-browser QA, bug fixes, deployment tooling and handover documentation.

## Documentation

| Document | What it covers |
|---|---|
| [docs/HANDOVER.md](docs/HANDOVER.md) | Project overview, architecture, service → backend map, folder structure, credentials, limitations, roadmap |
| [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md) | How to use every admin screen |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel deployment, environment variables, domain, checks, rollback, real payments and email |
| [docs/TEST-REPORT.md](docs/TEST-REPORT.md) | Final QA checklist, smoke results, bug-fix log, accessibility and responsive review |
| [docs/CROSS-BROWSER.md](docs/CROSS-BROWSER.md) | Support matrix and the browser features the app relies on |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Per-milestone summary |
| docs/SECURITY.md, docs/PERFORMANCE.md | Security and performance notes (Milestone 4) |

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

No database or environment variables are needed. Set `NEXT_PUBLIC_SITE_URL` in production (see `.env.example`).

| Script | Purpose |
|---|---|
| `npm run verify` | `lint` + `typecheck` + `build` — run before every deploy |
| `npm run smoke` | Requests every route and prints a pass/fail table (`BASE_URL=https://… npm run smoke` for production) |
| `npm run lint` / `npm run typecheck` / `npm run build` / `npm start` | Individual steps |

## Try it

- Storefront: `/`, search and filters under `/products`, product pages, bag and checkout.
- Admin: `/admin/login` → **admin@couture.test / Admin@12345**. The dashboard seeds demo customers and orders on first visit; "Reset demo data" clears everything.
- Test payments: card `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (declined), `4000 0000 0000 9995` (insufficient funds); UPI `success@upi` / `fail@upi`. Coupons `WELCOME10`, `FLAT5` (`SUMMER25` is intentionally expired).

## Stack and architecture in one paragraph

Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4 (design tokens in `src/app/globals.css`, Figtree via `next/font`). Server components render the base catalog (`src/lib/mockData.ts` through `src/lib/api.ts`, also exposed as rate-limited JSON under `/api`); client wrappers in `src/components/storefront/` re-run the same queries against the effective catalog once admin edits exist. All customer and admin data lives in the browser's `localStorage` (`couture:v1:*`) behind typed service modules in `src/lib/services/` — the swap point for a real backend. Payments go through the `PaymentGateway` interface in `src/lib/payments/gateway.ts` (test-mode provider included) and email through the `EmailTransport` interface in `src/lib/services/notifications.ts`. Details in the handover document.

## Project structure

```
src/app/            routes (storefront, account, checkout, admin, api, robots, sitemap), layout, error boundaries
src/components/     UI: header/footer, product cards, home/, catalog/, storefront/, auth/, account/, cart/, checkout/,
                    wishlist/, reviews/, notifications/, admin/, ui/ primitives
src/context/        Auth, Cart, Wishlist, Toast providers
src/hooks/          live data hooks (useCatalog, useOrders, useAllOrders, useAnalytics, ...)
src/lib/            catalog query engine, pricing, coupons, validation, storage, seo, rateLimit, payments/, services/
scripts/            smoke.mjs
docs/               handover documentation
prisma/             future database schema (not used at runtime)
```

## Credits

Product, category and hero photography: Unsplash.
