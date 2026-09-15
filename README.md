# Couture — Modern E-Commerce Platform (Milestone 1)

Couture is a modern storefront built per the project PRD. This repo delivers **Milestone 1 — the storefront foundation** — as a single Next.js app that runs with zero configuration on a fresh clone or Vercel deploy. The UI follows a Myntra-style design system (white canvas, pink primary, bold uppercase navigation, squared cards).

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

### Milestone 2 previews

The header's Profile / Wishlist / Bag icons, the wishlist hearts and the "Add to bag" / "Buy now" buttons are present as UI previews only — they give local feedback but do not persist anything. Authentication, wishlist, cart, checkout, reviews and advanced filtering are Milestone 2 deliverables.

## Project structure

```
src/app/            App Router pages: /, /products, /categories/[slug], /products/[slug]; JSON API under /api
src/components/     Header (+ header/ nav colours & icons), Footer, ProductCard, ProductActions, ProductGallery,
                    SortSelect, Pagination, StarRating, CategoryCard, home/ (carousel, banners, rails)
src/lib/            mock catalog data, typed catalog helpers (search, sort, pagination), formatting
prisma/             future database schema (not used at runtime)
```

## Credits

Product, category and hero photography: Unsplash.
