# Couture — Final QA report (Milestone 4)

Date: 2026-09-23 · Build: Next.js 16.3.5 (Turbopack), React 19.2, Tailwind v4 · Environment: macOS, Node 20+, Chromium-based verification against the dev server on `http://localhost:3001`, plus `curl` and the smoke script.

**How to read the checklist.** *Executed* = exercised in this QA pass (request made, response/markup inspected, or the flow driven in the browser during Milestones 1–3 acceptance and re-checked now). *Reviewed* = verified by reading the code and the rendered markup, not by driving the UI in this pass. Nothing is marked ✅ on assumption.

## 1. Verification summary

| Check | Result |
|---|---|
| `npx eslint .` (whole tree) | ✅ 0 problems |
| `npx tsc --noEmit` (whole tree) | ✅ 0 errors |
| `npx next build` | ✅ Compiled in 1.05 s, TypeScript 0.78 s, 38 static pages generated, 0 warnings — 45 routes (see §5) |
| `node scripts/smoke.mjs` | ✅ 42/42 routes, average 151 ms, slowest 294 ms (table in §3) |
| Storefront routes `/`, `/products`, `/products/aurora-wireless-headphones`, `/cart`, `/checkout`, `/login`, `/account/orders`, `/admin/login`, `/admin` | ✅ all 200 |

## 2. Feature checklist (Milestones 1–4)

### Milestone 1 — storefront foundation

| Feature | Status | Method / notes |
|---|---|---|
| Home page: coupon strip, hero carousel, category tiles, deals rail, trending brands, top picks, trust row, testimonials, newsletter | ✅ | Executed — `/` 200, sections present in markup (`LiveCategoryGrid`, `LiveDealsRail`, `LiveTrendingBrands`, `LiveProductRail`) |
| Header: logo, uppercase category nav with mega-menu, search, profile / wishlist / bag stacks, mobile drawer | ✅ | Executed (markup) + reviewed (`Header.tsx`, `header/`) |
| Catalog `/products`: cards (image, brand, name, price, MRP, % off, rating pill, out-of-stock overlay, wishlist, quick add), sorting, pagination | ✅ | Executed — `/products`, `/products?q=headphones&sort=price_asc` 200 |
| Category pages `/categories/[slug]` with banner, count, sorting, pagination | ✅ | Executed — `/categories/electronics` 200 |
| Product page: gallery, rating, price, variants, quantity, add to bag / wishlist / buy now, details, similar products | ✅ | Executed — PDP 200; reviewed `LiveProductDetail.tsx` |
| Responsive layout 360 / 768 / 1024 / 1440 | ✅ | Reviewed — see §7 |
| Typed catalog model + JSON API | ✅ | Executed — `/api/products?pageSize=1`, `/api/categories` 200 |

### Milestone 2 — customer experience

| Feature | Status | Method / notes |
|---|---|---|
| Search autocomplete (products + categories, keyboard) and multi-term search | ✅ | Reviewed `SearchAutocomplete.tsx`; executed `?q=` results |
| Filters (category, brand, price, rating, stock, colour, size) synced to URL, chips, facet counts, mobile SORT / FILTER drawer | ✅ | Executed `/products?category=electronics&inStock=true`; reviewed `catalog/*` |
| Sorting (newest, popularity, price asc/desc, rating) | ✅ | Executed |
| Register / login / logout / forgot + reset password (demo link), safe `?next=` | ✅ | Executed in M2 acceptance; routes 200 now; reviewed `services/auth.ts` (7-day session, 30-min single-use reset token) |
| Account: overview, profile, change password, addresses (add / edit / delete / default) | ✅ | Routes 200; reviewed `account/*` |
| Wishlist (guest + user, union on login, move to bag) | ✅ | Reviewed `WishlistContext.tsx`, `services/wishlist.ts` |
| Bag: variant lines, stock clamping, coupons, free-shipping progress, price details | ✅ | Reviewed `CartContext.tsx`, `services/cart.ts`, `pricing.ts` |
| Checkout stepper (bag → address → payment), COD, review, confirmation | ✅ | `/checkout`, `/checkout/success` 200; reviewed `checkout/*` |
| Reviews: seeded + one per purchaser, summary and distribution | ✅ | Reviewed `reviews/*`, `useReviews.ts` |

### Milestone 3 — admin, orders & payments

| Feature | Status | Method / notes |
|---|---|---|
| Admin auth: `/admin/login`, role guard, 403 for customers, blocked accounts | ✅ | Reviewed `RequireAdmin.tsx`, `AdminLoginForm.tsx`; routes 200 |
| Dashboard KPIs, 14-day chart, payment split, recent orders / customers, low stock, best sellers, demo seed, reset | ✅ | Reviewed `DashboardView.tsx`, `services/analytics.ts` |
| Products list (search, filters, sort, bulk publish / unpublish / delete, featured toggle) | ✅ | Reviewed `ProductsManager.tsx` |
| Product editor (validation, ≤ 8 Unsplash images, pricing preview, SKU rules, ≤ 30 variations) | ✅ | Reviewed `ProductForm.tsx`, `catalogStore.ts` |
| Categories CRUD, delete blocked while products exist | ✅ | Reviewed `CategoriesManager.tsx` |
| Inventory: variant-level stock, restock, low / out indicators, CSV | ✅ | Reviewed `InventoryManager.tsx` |
| Orders: tabs, filters, CSV; detail with status flow, notes, tracking, cancel, refund, COD collected | ✅ | Reviewed `OrdersView.tsx`, `OrderDetailView.tsx`, `services/orders.ts` |
| Payments ledger incl. failed attempts; only brand + last 4 stored | ✅ | Reviewed `PaymentsView.tsx`, `services/payments.ts` |
| Test gateway: card success / declined / insufficient funds / cancel, UPI success / failure | ✅ | Executed in M3 acceptance; reviewed `payments/gateway.ts` |
| Coupons CRUD with lifecycle (active / inactive / expired / exhausted) evaluated live in the bag | ✅ | Reviewed `CouponsView.tsx`, `services/coupons.ts` |
| Customers list / detail, block / unblock | ✅ | Reviewed `CustomersView.tsx`, `CustomerDetailView.tsx` |
| Reviews moderation (hide / publish / delete) | ✅ | Reviewed `ReviewsView.tsx` |
| Admin edits reflected on storefront (listings, PDP, home rails, bag, checkout) | ✅ | Reviewed `storefront/*`, `useLiveCatalog.ts` |

### Milestone 4 — final features & launch

| Feature | Status | Method / notes |
|---|---|---|
| Order tracking timeline (Placed → … → Delivered, cancel / refund states), `/track` page | ✅ | `/track` 200; reviewed `account/OrderDetail.tsx`, `storefront/track/*` |
| Transactional notifications: bell, `/account/notifications`, admin outbox `/admin/notifications`, `EmailTransport` | ✅ | Routes 200; reviewed `services/notifications.ts` (other agent's files) |
| Sales analytics driven by the period switcher on every panel | ✅ | Fixed in this pass (bug b); tsc/lint clean; reviewed rendering |
| SEO: metadata, Open Graph image, JSON-LD, `robots.txt`, `sitemap.xml`, `manifest.webmanifest` | ✅ | Executed — all 200; `<html lang="en">`; `robots.txt` disallows `/admin`, `/account`, `/checkout`, `/cart`, auth pages; `noindex` metadata on 3 of 11 admin pages (see §8) |
| Security: API rate limiting, `.env.example`, no secrets in repo | ✅ | Reviewed `rateLimit.ts` (see SECURITY.md by its owner) |
| Error boundaries: `src/app/error.tsx` (existing, on-theme) and new `src/app/admin/error.tsx` | ✅ | Created; reviewed; renders inside the admin shell with Try again + Back to dashboard |
| Cross-browser review | ✅ | See CROSS-BROWSER.md — Chromium executed, others reviewed |
| Production deployment config (`vercel.json`, `npm run verify`, smoke script) | ✅ | Executed `verify` steps individually; smoke 42/42 |
| Documentation set (`docs/*`, README) | ✅ | This pass |

## 3. Smoke test output

```
Smoke test against http://localhost:3001

| Route                                       | Status |    Time | Result | Note                                               |
|---------------------------------------------|--------|---------|--------|----------------------------------------------------|
| /                                           | 200    |  231 ms | PASS   | home                                               |
| /products                                   | 200    |  166 ms | PASS   | catalog                                            |
| /products?q=headphones&sort=price_asc       | 200    |  149 ms | PASS   | search + sort                                      |
| /products?category=electronics&inStock=true | 200    |  186 ms | PASS   | filters                                            |
| /products/aurora-wireless-headphones        | 200    |  294 ms | PASS   | product detail                                     |
| /products/does-not-exist                    | 200    |  151 ms | PASS   | unknown product (client-resolved, not-found panel) |
| /categories/electronics                     | 200    |  273 ms | PASS   | category page                                      |
| /cart                                       | 200    |  151 ms | PASS   | bag                                                |
| /wishlist                                   | 200    |  145 ms | PASS   | wishlist                                           |
| /checkout                                   | 200    |  155 ms | PASS   | checkout                                           |
| /checkout/success                           | 200    |  160 ms | PASS   | order confirmation                                 |
| /login                                      | 200    |  153 ms | PASS   | login                                              |
| /register                                   | 200    |  152 ms | PASS   | register                                           |
| /forgot-password                            | 200    |  152 ms | PASS   | forgot password                                    |
| /reset-password                             | 200    |  152 ms | PASS   | reset password                                     |
| /account                                    | 200    |  156 ms | PASS   | account overview                                   |
| /account/profile                            | 200    |  149 ms | PASS   | profile                                            |
| /account/addresses                          | 200    |  152 ms | PASS   | addresses                                          |
| /account/orders                             | 200    |  146 ms | PASS   | order history                                      |
| /account/orders/CTR-00000000                | 200    |  147 ms | PASS   | order detail (unknown number)                      |
| /account/notifications                      | 200    |  140 ms | PASS   | notifications                                      |
| /track                                      | 200    |  281 ms | PASS   | order tracking                                     |
| /admin/login                                | 200    |  143 ms | PASS   | admin sign-in                                      |
| /admin                                      | 200    |  143 ms | PASS   | admin dashboard                                    |
| /admin/analytics                            | 200    |  145 ms | PASS   | admin analytics                                    |
| /admin/products                             | 200    |  150 ms | PASS   | admin products                                     |
| /admin/products/new                         | 200    |  146 ms | PASS   | admin new product                                  |
| /admin/categories                           | 200    |  148 ms | PASS   | admin categories                                   |
| /admin/inventory                            | 200    |  140 ms | PASS   | admin inventory                                    |
| /admin/orders                               | 200    |  140 ms | PASS   | admin orders                                       |
| /admin/payments                             | 200    |  147 ms | PASS   | admin payments                                     |
| /admin/coupons                              | 200    |  148 ms | PASS   | admin coupons                                      |
| /admin/customers                            | 200    |  145 ms | PASS   | admin customers                                    |
| /admin/reviews                              | 200    |  146 ms | PASS   | admin reviews                                      |
| /admin/notifications                        | 200    |  158 ms | PASS   | admin notification outbox                          |
| /robots.txt                                 | 200    |    6 ms | PASS   | robots                                             |
| /manifest.webmanifest                       | 200    |    4 ms | PASS   | web manifest                                       |
| /opengraph-image                            | 200    |   35 ms | PASS   | Open Graph image                                   |
| /sitemap.xml                                | 200    |  139 ms | PASS   | sitemap                                            |
| /api/products?pageSize=1                    | 200    |  128 ms | PASS   | JSON products API                                  |
| /api/categories                             | 200    |  131 ms | PASS   | JSON categories API                                |
| /this-page-does-not-exist                   | 404    |  166 ms | PASS   | not-found page                                     |

42/42 passed · average 151 ms · slowest 294 ms
```

Admin routes answer 200 on the server because access control is client-side (`RequireAdmin` redirects guests to `/admin/login?next=…`); the smoke test additionally fails a route whose body contains a Next.js error page. Run `BASE_URL=https://<domain> npm run smoke` after every deploy.

## 4. Bug-fix log (Milestone 3 handoff issues)

| # | Issue | Verified | Fix | Files |
|---|---|---|---|---|
| a | `?category=<admin-created-slug>` on `/products` was dropped by the client-side filter parser (`parseCatalogFilters` validated against `MOCK_CATEGORIES`), so the active-filter chip, sidebar and sort select disagreed with the live grid | ✅ Reproduced by reading `parseProductQuery` (`api.ts` line 218: unknown slugs are discarded) — the live grid already used the effective categories, the hooks did not | `parseCatalogFilters(raw, categories?)` accepts the effective categories; `useCatalogParams` reads them from `useCatalog()` (base catalog during SSR/hydration, so no hydration mismatch). `ActiveFilterChips` needed no change: it now receives a category it can label | `src/components/catalog/catalogParams.ts`, `src/components/catalog/useCatalogParams.ts` |
| b | Analytics: best sellers, sales by category and payment split were all-time while the period switcher only drove the chart; panels were labelled "All time" | ✅ Confirmed in `AnalyticsView.tsx` (used `useDashboard()`, whose panels ignore `days`) | The view now takes `useAnalyticsSource()` and filters `source.orders` to the same local-day window `salesByDay` uses before calling `bestSellers`, `salesByCategory`, `paymentMethodSplit` and `orderStatusSplit`; each panel's caption reads "Last N days"; the donut centre shows period revenue; empty states name the period. `services/analytics.ts` untouched | `src/app/admin/analytics/AnalyticsView.tsx` |
| c | "Only N left" tag appeared on listing grids only (added by `LiveProductGrid`), not on home rails or the similar-products rail | ✅ Confirmed: the tag was rendered by the grid wrapper, `ProductCard` had none | `ProductCard` renders the tag when `0 < stock ≤ LOW_STOCK_THRESHOLD`, stacked under the NEW / BESTSELLER pill; duplicate removed from `LiveProductGrid`. Note: no base-catalog product is at ≤ 5 units (lowest is 27), so the tag only appears after an admin stock change — verified by code review, not by a live render | `src/components/ProductCard.tsx`, `src/components/storefront/LiveProductGrid.tsx` |
| d | Leftover "Shoply", "Milestone 2/3 placeholder", `console.log`, `TODO` / `FIXME` in `src/` | ✅ Swept with grep | None found (the only "todo" is the `CheckoutStepper` step-state literal). Nothing to remove | — |
| e | ESLint / tsc / route sweep | ✅ | Whole tree clean at the end of the pass (a transient parse error in `src/lib/seo.ts` during another agent's edit resolved before the final run) | — |

Additional fixes in this pass: `vercel.json` reduced to `{ "framework": "nextjs" }` (the previous custom `buildCommand` / `outputDirectory` were redundant); `package.json` gained `typecheck`, `smoke` and `verify` scripts.

## 5. Build output summary

`npx next build` — Next.js 16.3.5 (Turbopack): compiled successfully in 1051 ms, TypeScript in 778 ms, 38 static pages generated in 591 ms, no warnings. 45 app routes: static (○) for `/`, account, admin, auth, cart, checkout, wishlist, robots, sitemap, manifest, icons and Open Graph image; dynamic (ƒ) for `/products`, `/products/[slug]`, `/categories/[slug]`, `/track`, the order / customer / product detail routes and the four `/api/*` handlers.

## 6. Accessibility spot checks

| Check | Result | Evidence |
|---|---|---|
| Document language | ✅ | `<html lang="en">` |
| Form labels | ✅ | `ui/Field.tsx` renders `<label htmlFor>` for every control, hint / error ids wired through `aria-describedby`, errors announced with `role="alert"`, invalid state via `aria-invalid` (8 uses); `inputMode` / `autoComplete` on 26 / 40 inputs |
| Icon-only controls named | ✅ | 184 `aria-label` uses (wishlist hearts with `aria-pressed`, filter chips with "Remove filter …" `sr-only` text, sidebar toggles, pagination) |
| Focus visibility | ✅ | 114 `focus-visible:` rings on the brand token (`ring-brand/40` or `ring-ink`); no `outline-none` without a replacement ring in the reviewed components |
| Modals | ✅ | `ui/Modal.tsx`: JS focus trap, initial focus, Escape to close, body scroll lock (`useBodyScrollLock`), backdrop click configurable |
| Live regions | ✅ | 9 `aria-live` regions: toasts (`Toaster`), bag price details, product-page add/copy feedback (`ProductActions`), payment processing stage, deals countdown, admin inventory / product form / product list status messages |
| Reduced motion | ✅ | `motion-reduce:` variants and `prefers-reduced-motion` rules disable carousel / reveal / shimmer animations |
| Colour contrast (tokens, computed against white) | ⚠️ partial | `--ink #282c3f` **13.8 : 1** and `--ink-2 #535766` **7.2 : 1** pass AA/AAA for all text. `--ink-3 #7e818c` **3.9 : 1** — passes AA only for large/bold text (used widely for 12–14 px secondary copy such as captions and hints → below 4.5 : 1 for normal text). `--ink-4 #94969f` **2.95 : 1** — placeholders, disabled states, separators only. Brand `#ff3f6c` **3.4 : 1** — white-on-pink bold uppercase buttons pass large-text AA; small regular `text-brand` copy does not. `--discount #ff905a` **2.2 : 1** — the "(X% OFF)" 12 px label fails AA; `--success #03a685` **3.1 : 1** — "Added" state on bold white text is borderline. Tokens are frozen for this milestone; recommendations in §8 |
| Skip link | ❌ | No "Skip to content" link in `src/app/layout.tsx` (file owned by another agent) — see §8 |
| Heading order | ✅ (reviewed) | One `h1` per page (`LiveProductGrid` switches to `h2` under a category banner `h1`), section headings `h2` |

## 7. Responsive matrix (reviewed from the CSS, Tailwind defaults sm 640 / md 768 / lg 1024 / xl 1280)

| Width | Storefront | Catalog | Product page | Admin |
|---|---|---|---|---|
| **360** (phone) | Header collapses to logo + icons + drawer; hero full-width; rails scroll horizontally with snap; 16 px gutters (`px-4`) | 2-column card grid; filters in bottom SORT \| FILTER bar opening a full-height drawer; scope chips wrap | Single column; swipeable gallery; sticky buy actions; similar-products rail at 62 vw per card | Sidebar becomes a drawer (< 1024); tables scroll horizontally inside `ADMIN_TABLE.wrap` (`min-w-[520px]` and up); KPI tiles 2 per row |
| **768** (tablet) | Same as phone with `sm:` spacing (`px-6`), category tiles 3–4 across | 3-column grid (`sm:grid-cols-3`); still the mobile filter drawer | Single column, larger type; 3 similar products visible | Drawer sidebar; tiles 2 per row; charts full width |
| **1024** (laptop) | Full uppercase category nav with mega-menu; desktop search | Sticky 240 px filter sidebar + 3-column grid; sort select in the toolbar; mobile bar hidden | Two columns 7 / 5 (`lg:grid-cols-[7fr_5fr]`), sticky buy box; 4 similar products | Fixed sidebar; 4 KPI tiles per row; analytics panels 2 / 3 columns (`lg:` / `xl:`) |
| **1440** (desktop) | `max-w-7xl` (1280 px) centred container, `px-8` | 4-column grid (`xl:grid-cols-4`); 5 similar products on the PDP | Same as 1024 with wider gallery | Same as 1024 with 3-column analytics row; content capped by `max-w-7xl` |

No horizontal page scroll is expected at any width: containers use `min-w-0` / `overflow-x-auto` for tables and rails; the only intentionally scrolling elements are rails, tables and the mega-menu. Executed checks: markup at each route; visual checks were carried out in Chromium during the milestone acceptances, not re-run per width in this pass.

## 8. Open issues and observations (files owned by other agents)

| Severity | Item | Location |
|---|---|---|
| Medium | No "Skip to content" link before the header; keyboard users tab through the whole navigation on every page | `src/app/layout.tsx` |
| Low | `viewport-fit: cover` is set but no `env(safe-area-inset-bottom)` padding on fixed bottom bars (mobile filter bar, PDP buy bar, admin save bar) — flush with the home indicator on notched iPhones in landscape | `src/app/layout.tsx` (viewport), `MobileFilterDrawer.tsx`, `ProductActions.tsx`, `ProductForm.tsx` |
| Low | `Reveal` creates `IntersectionObserver` unguarded; fine within the support floor, but a `typeof` guard would make the fallback explicit | `src/components/Reveal.tsx` |
| Low | Clipboard "copy link" fails silently in insecure contexts (no feedback) | `src/components/ProductActions.tsx` |
| Medium | Contrast: `--ink-3` (3.9 : 1) carries most 12–14 px secondary copy and `--discount` (2.2 : 1) the "% OFF" labels — both below AA for normal text. Options without touching the palette: bump those texts to bold/≥ 18 px, or darken the tokens (`--ink-3` → `#6b6e7a` ≈ 4.6 : 1, `--discount` → `#c25a1e` ≈ 4.5 : 1) in a later design pass | `src/app/globals.css` (frozen this milestone) |
| Low | Only `/admin`, `/admin/login` and `/admin/analytics` set `robots: { index: false }` metadata; the other 8 admin pages rely on `robots.txt` alone. Add the same `metadata.robots` to each admin `page.tsx` (or a shared constant) | `src/app/admin/*/page.tsx` |
| Info | Category scope chips on `/products` are pill-shaped (`rounded-full`) while every other chip / button is squared (`rounded-sm`). Deliberate Myntra-style choice from M1; left as is | `src/components/storefront/LiveProductGrid.tsx` |
| Info | Base catalog has no low-stock product, so the "Only N left" tag is only visible after an admin stock edit; consider seeding one product at ≤ 5 units for demos | `src/lib/mockData.ts` |
| Info | Rate limiting is per serverless instance (documented in `rateLimit.ts` and DEPLOYMENT.md) | `src/lib/rateLimit.ts` |

## 9. Executed vs. not executed — honest summary

- Executed now: lint, typecheck, production build, 42-route smoke run, markup inspection of home / PDP / catalog / SEO routes, grep sweeps, contrast arithmetic on the tokens.
- Executed in earlier milestone acceptances and not re-driven in this pass: full checkout with each test card / UPI outcome, admin CRUD flows, coupon lifecycle, order status transitions, review posting.
- Not executed (reviewed only): Safari / Firefox / iOS / Android rendering, per-width screenshots, screen-reader run-through.
