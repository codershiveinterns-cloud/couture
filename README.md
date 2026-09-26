# Couture — Modern E-Commerce Platform (Milestones 1–3)

Couture is a modern storefront built per the project PRD. This repo delivers **Milestone 1 (storefront foundation), Milestone 2 (customer shopping experience) and Milestone 3 (admin, orders & payments)** as a single Next.js app that runs with zero configuration on a fresh clone or Vercel deploy. The UI follows a Myntra-style design system (white canvas, pink primary, bold uppercase navigation, squared cards).

## Stack

- **Framework:** Next.js 16 (App Router, Server Components), React 19, TypeScript
- **Styling:** Tailwind CSS v4 with a design-token layer in `src/app/globals.css`; Figtree via `next/font`
- **Catalog data:** static mock data in `src/lib/mockData.ts` (5 categories, 26 products with images and variants), served through typed helpers in `src/lib/api.ts` and mirrored as JSON route handlers under `src/app/api/*`
- **Images:** Unsplash (served through `next/image`)

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables or database are required. The project deploys to Vercel as-is.

Other scripts: `npm run lint` (ESLint), `npx tsc --noEmit` (type check), `npm run build` / `npm start` (production build).

## Milestone 1 — storefront foundation (delivered)

- **Homepage:** coupon strip, hero carousel, "Shop by category" tiles, "Deals of the day" and "Top picks" product rails, testimonials
- **Header:** logo, uppercase category navigation with colour-coded underline and hover mega-menu, search bar (keyword search → `/products?q=`), Profile / Wishlist / Bag icon stacks, mobile drawer
- **Product catalog:** product cards (image, brand, name, price, MRP + discount %, rating pill, availability, wishlist and quick "Add to bag" previews), category chips, sorting (What's New / Popularity / Price / Rating), pagination
- **Category pages:** title, description, item count, sorting, pagination
- **Product detail page:** 2×2 image gallery (swipe carousel on mobile), brand + name, rating badge, price with MRP and discount, colour / size variants with per-variant stock and price deltas, quantity stepper, Add to bag / Wishlist / Buy now, delivery-options pincode check (UI), product details, similar products
- **Responsive layout** (mobile / tablet / desktop) with accessible controls
- **Initial data structure:** typed catalog model (`src/lib/types.ts`, `src/lib/mockTypes.ts`) and `prisma/` schema scaffolding for the future database (not used at runtime)

## Milestone 2 — customer experience (delivered)

- **Search:** header autocomplete (products + categories, keyboard navigable, popular searches) and multi-term search across name, SKU, brand, category and descriptions
- **Advanced filters:** category, brand, price range, minimum rating, in-stock, colour and size — desktop sidebar and mobile SORT | FILTER drawer synced to URL params, active-filter chips, facet counts
- **Sorting:** What's New, Popularity, Price (asc/desc), Customer Rating
- **Authentication:** register, login, logout, forgot password + reset password (demo mode), safe `?next=` redirects
- **Account:** overview, profile (name/email/phone), change password, addresses (add/edit/delete/default), order history and order detail with status timeline
- **Wishlist:** persistent for guests and users, toggle from cards and product pages, move to bag
- **Bag:** line items keyed by product + variant, quantity with stock clamping, coupons, free-shipping progress, price details (MRP, discount, coupon, shipping, tax)
- **Checkout:** BAG → ADDRESS → PAYMENT stepper, saved or new address, Cash on Delivery (card / UPI arrive with real payments in Milestone 3), order review, confirmation page
- **Reviews:** seeded demo reviews plus one review per logged-in user, rating summary and distribution

## Milestone 3 — admin, orders & payments (delivered)

Admin area at `/admin` (sign in at `/admin/login`; demo admin **admin@couture.test / Admin@12345**). Role-based access: only `admin` users pass the guard; customers get a 403 panel.

- **Dashboard:** total sales, orders, customers, products, pending / completed orders, average order value, low-stock items, 14-day sales overview, recent orders and customers, best sellers, payment-method split; demo activity is seeded on first visit and can be reset
- **Sales analytics:** 7 / 14 / 30-day revenue and orders, AOV, customer count, best-selling products, sales by category, payment split, order-status breakdown
- **Products:** list with search, filters, sort, bulk actions; add / edit / delete, publish / unpublish, featured, images (URL based), descriptions, pricing with MRP and live % off, SKU, stock, variations with per-variant SKU / stock / price delta
- **Categories:** create / edit / delete (blocked while products exist), image, slug, description, product counts
- **Inventory:** product and variation-level stock, inline updates, restock, low-stock (≤ 5) and out-of-stock indicators, CSV export
- **Orders:** search and filters, order detail, status flow *Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered* plus cancel and refund, status notes, carrier + tracking number, customer and payment data, CSV export; stock is decremented on purchase and restored on cancellation
- **Payments:** gateway abstraction (`src/lib/payments/gateway.ts`) with a built-in **Couture Pay test-mode** provider — card and UPI with success, decline, insufficient-funds and cancel outcomes; payment records linked to orders; statuses Pending / Paid / Failed / Cancelled / Refunded; COD collection; only card brand + last 4 are ever stored. A real provider (Razorpay / Stripe) implements the same interface server-side with keys from environment variables
- **Coupons & discounts:** percentage or fixed, minimum order, maximum discount, expiry, usage limit and usage count, active / inactive — evaluated live in the bag
- **Customers:** name, email, phone, registration date, order count, total spend, status; detail with order history; block / unblock
- **Reviews moderation:** hide / publish / delete
- **Storefront integration:** admin edits (price, stock, content, publish state, new products and categories) appear on listings, product pages, home rails, bag and checkout; customers see the full order timeline with tracking and can cancel before shipment

Test payment inputs: card `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (declined), `4000 0000 0000 9995` (insufficient funds); UPI `success@upi` / `fail@upi`.

## Demo data layer

There is no backend or database yet. Everything a customer does is stored in the browser's `localStorage` behind typed service modules in `src/lib/services/` so that a real backend can swap in APIs without touching the UI (the catalog, orders, payments, coupons, customers and analytics services used by the admin area follow the same pattern).

- Keys are prefixed `couture:v1:` (`users`, `session`, `resetTokens`, `reviews`, and per-owner `cart:<id>`, `coupon:<id>`, `wishlist:<id>`, `addresses:<userId>`, `orders:<userId>`).
- Passwords are salted and hashed with SHA-256 (Web Crypto); sessions expire after 7 days.
- Guests can use the bag and wishlist; on login/registration the guest bag is merged into the user's bag and the wishlist is unioned.
- Pricing: free shipping at $50 (otherwise $5.99), 8% tax, coupon applied before shipping and tax. Coupons: `WELCOME10` (10% off, min $30, max $25), `FLAT5` ($5 off, min $20), `SUMMER25` (intentionally expired, to demo the error path).
- Password reset: `/forgot-password` shows a clearly labelled **demo-mode reset link** when the account exists (no email service yet). Tokens are single-use and expire after 30 minutes.

## Project structure

```
src/app/            App Router pages: /, /products, /categories/[slug], /products/[slug], /login, /register,
                    /forgot-password, /reset-password, /account (overview, profile, addresses, orders),
                    /wishlist, /cart, /checkout, /admin (dashboard, analytics, products, categories, inventory,
                    orders, payments, coupons, customers, reviews); JSON API under /api
src/components/     Header (+ header/), Footer, ProductCard, ProductActions, ProductGallery, home/, catalog/
                    (filters, search), auth/, account/, cart/, checkout/, wishlist/, reviews/, forms/, ui/
src/context/        Auth, Cart, Wishlist and Toast providers + hooks
src/hooks/          useHydrated, useAddresses, useOrders, useReviews, ...
src/lib/            mock catalog data, catalog helpers (search, filters, sort, pagination), pricing, coupons,
                    validation, safeRedirect, storage, services/ (auth, cart, wishlist, addresses, orders, reviews)
prisma/             future database schema (not used at runtime)
```

## Credits

Product, category and hero photography: Unsplash.
