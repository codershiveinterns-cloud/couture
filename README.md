# Shoply — Modern E-Commerce Platform

Full-stack e-commerce storefront built per the project PRD. This delivers **Milestone 1: Warm-Up / Core Foundation** ($800 scope).

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- **Backend:** Node.js, Express, REST API
- **Database:** PostgreSQL, via Prisma ORM
- **Images:** picsum.photos placeholders (swap for real product photography / cloud storage in a later milestone)

## Milestone 1 scope (delivered)

- Homepage (hero, category grid, featured/popular product rails, testimonials)
- Header with navigation, live search, and mobile menu; footer with newsletter signup
- Product catalog with pagination, category filtering, sorting, and keyword search
- Category pages
- Product detail page: image gallery, variant selection, quantity, description, related products
- Product images and basic product variations (e.g. color/size) with per-variant stock and pricing
- Initial database schema covering every core entity from the PRD (Users, Products, Categories, Variants, Cart, Orders, Order Items, Payments, Reviews, Coupons) — later milestones build on this without re-migrating
- Responsive layout (mobile / tablet / desktop)
- Frontend↔backend integration over a versioned REST API
- Basic product/category REST APIs

Cart, checkout, authentication, payments, admin dashboard, coupons, and analytics are **out of scope for Milestone 1** and land in Milestones 2–4 per the PRD. The product page's Add to Cart / Buy Now / Wishlist controls are visible and interactive in the UI, but are intentionally disabled from persisting anywhere yet — see the note on that page.

## Project structure

```
backend/    Express REST API + Prisma schema/migrations/seed
frontend/   Next.js storefront
```

## Local setup

### 1. Database

Requires PostgreSQL. Set `backend/.env` `DATABASE_URL` to point at your instance (see `backend/.env.example`).

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev   # creates schema
npm run seed              # loads sample categories/products
npm run dev                # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # points NEXT_PUBLIC_API_URL at the backend
npm run dev                   # http://localhost:3000
```

Open `http://localhost:3000`.

## Notes for the next milestone

- Auth, cart, and checkout tables already exist in `backend/prisma/schema.prisma` — Milestone 2 wires up the APIs and UI against them.
- Swap `picsum.photos` seed images for real product photography and a cloud storage bucket when available.
