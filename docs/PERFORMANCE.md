# Performance, SEO and mobile — Milestone 4

Measured on 2026-09-23 against the dev server (`http://localhost:3001`) and one production
build (`npm run build`, Next 16.3.5 / Turbopack).

## 1. SEO

| Item | Where |
|---|---|
| Site-wide defaults: `metadataBase`, title template, description, OG/Twitter, robots, `applicationName`, Apple web-app | `src/app/layout.tsx` |
| `viewport` (`width=device-width, initial-scale=1, viewport-fit=cover`, `theme-color #ff3f6c`) | `src/app/layout.tsx` |
| Canonical (`alternates.canonical`), Open Graph + Twitter card per public page | `src/lib/seo.ts` → `pageMetadata()` used by `/`, `/products`, `/categories/[slug]`, `/products/[slug]` |
| Dynamic OG title/description/image for products (first product image) and categories (banner) | `generateMetadata` in those pages |
| `noindex` for `/cart`, `/checkout*`, `/account*`, `/wishlist`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/admin*`, `/api/*` | `X-Robots-Tag` header in `next.config.ts` (the page files are client components owned by other milestones; `/admin`, `/admin/login`, `/admin/analytics` also carry `robots` metadata). `/not-found` is `noindex, follow`. |
| `robots.txt` (disallows the above, links the sitemap) | `src/app/robots.ts` |
| `sitemap.xml` — home, `/products`, every category, every published base product with `lastModified` | `src/app/sitemap.ts` (33 URLs) |
| Web app manifest (`/manifest.webmanifest`, uses `/icon.png` 64×64 and `/apple-icon.png` 180×180) | `src/app/manifest.ts` |
| Generated default OG image (1200×630, no external fetches) | `src/app/opengraph-image.tsx` |
| JSON-LD: Organization + WebSite/SearchAction (home), ItemList (listing), BreadcrumbList + ItemList (category), Product with Offer + AggregateRating + BreadcrumbList (PDP) | builders in `src/lib/seo.ts`, injected as `<script type="application/ld+json">` with `<`/`>`/`&` escaped |

`NEXT_PUBLIC_SITE_URL` sets the origin for canonical/OG/sitemap/JSON-LD (fallback
`http://localhost:3000`) — set it in the deployment environment.

### Semantic HTML audit (one `<h1>` per page)

- `/products` — one `<h1>` (listing title). OK.
- `/categories/[slug]` — one `<h1>` in the banner; the listing title becomes an `<h2>`. OK.
- `/products/[slug]` — one `<h1>` (brand line above product name). OK.
- 404 / error pages — one `<h1>`. OK.
- **Flagged: `/` (home) has no `<h1>`.** The hero slide titles are `<h2>` (HeroCarousel) and
  every section title is an `<h2>`. Fix in a UI pass: promote the active hero slide's title to
  `<h1>` (or add a visually-hidden `<h1>` "Couture — Online Shopping…" at the top of
  `src/app/page.tsx`). Not changed here because HeroCarousel edits were limited to performance.
- Hero pagination dots are 8 px tall tap targets (`h-2`); flagged for the UI-refinement pass.

## 2. Performance

### Images (`next.config.ts`)

- `formats: ['image/avif', 'image/webp']` — `/_next/image` now answers `image/avif` (8.1 kB for
  the 360 px hero variant).
- `minimumCacheTTL: 30 days` (Unsplash URLs are immutable).
- `deviceSizes: [360, 640, 750, 828, 1080, 1200, 1600, 1920]` (adds the 360 px phone bucket,
  drops 2048/3840 which nothing requests) and `imageSizes` matching the thumbnail sizes the
  components actually use (36/56/72/110/160/220/256/384).
- Audit of every `next/image` / `FadeImage`: all have `sizes`; hero slide 1 and the category
  banner are `priority`; PDP gallery first two images are `priority`; everything else stays
  lazy (`loading="lazy"` default), so below-the-fold rails/cards do not compete with the LCP.

### JavaScript

- No third-party UI/chart libraries: the admin charts (`src/components/admin/charts`, ~500
  lines of hand-written SVG) and the PDP lightbox (inline in `ProductGallery`) are small, so
  `next/dynamic` would only add a request without shrinking the initial route meaningfully.
  Not applied.
- `package.json` has three runtime deps (`next`, `react`, `react-dom`) and only the dev deps
  the toolchain uses; nothing unused to remove.
- `reactStrictMode: true`, `poweredByHeader: false`.

### Bundle numbers (production build, from the prerendered HTML → chunk sizes)

No previous production manifest existed in `.next`, so there is no "before" column; the
numbers below are the post-milestone state. Next 16 no longer prints "First Load JS", so the
figures were computed by summing every `/_next/static/chunks/*.js` referenced by each
prerendered page (`.next/server/app/*.html`).

| Route | JS (raw) | JS (gzip) |
|---|---|---|
| `/_not-found` (framework floor) | 737 kB | 222.8 kB |
| `/` (home) | 763 kB | 230.1 kB |
| `/cart` | 760 kB | 229.5 kB |
| `/login` | 747 kB | 226.5 kB |
| `/checkout` | 806 kB | 244.0 kB |
| `/admin` (largest) | 826 kB | 251.1 kB |

Breakdown of the floor: `react-dom` runtime 224 kB raw (70 kB gz), Next app-router runtime
162 kB (44 kB gz), Next polyfill chunk 110 kB (39 kB gz), app providers + demo data layer
(`services/*`, `mockData` catalog needed client-side for the localStorage catalog store)
~150 kB raw (≈40 kB gz). App code is therefore roughly 15 % of what ships; the rest is the
framework. Every route is < 260 kB gzipped and the customer-facing routes are all
< 245 kB gz, so no page exceeded the 250 kB (gzip) budget the milestone set; the one lever
that would move the number materially is dropping `mockData` from the client bundle, which
belongs to the data-layer swap (real API) rather than this milestone.

### Dynamic vs static

`/`, `/cart`, `/checkout`, `/login`, account and admin pages are prerendered (○);
`/products`, `/categories/[slug]`, `/products/[slug]` and the API routes are dynamic (ƒ) by
design so catalog changes appear without a rebuild.

## 3. Mobile

- `viewport` export as above; `theme-color` and manifest for installability.
- Tap targets: header icons and hamburger are 40 × 40 (`h-10 w-10`); ProductCard's
  touch-only wishlist heart was 32 px → now 40 px, and the card's "Add to bag"/"Wishlist"
  buttons were 36 px → now 40 px tall.
- Horizontal overflow at 360 px (reasoned from CSS): the only `min-w-[…]` rules on customer
  pages are inside horizontal snap rails (`overflow-x-auto`), on buttons that only apply at
  `sm:` and up, a 160 px sticky-bar button that fits beside the total at 328 px content
  width, and an 18 px badge. Admin tables set `min-w-[720–1000px]` but sit inside
  `ADMIN_TABLE.wrap` (`overflow-x-auto`). No page-level offenders found.

## 4. How to verify

```bash
# Metadata routes
for r in /robots.txt /sitemap.xml /manifest.webmanifest /opengraph-image; do curl -s -o /dev/null -w "$r %{http_code} %{content_type}\n" http://localhost:3001$r; done

# Meta tags + JSON-LD on a product page
curl -s http://localhost:3001/products/aurora-wireless-headphones | grep -oE '<(title|link rel="canonical"|meta (name|property)="(description|og:[a-z:]+|twitter:[a-z]+)")[^>]*>'
curl -s http://localhost:3001/products/aurora-wireless-headphones | grep -o '<script type="application/ld+json">[^<]*' | head -c 600

# AVIF from the image optimiser
curl -s -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' -H 'Accept: image/avif,image/webp' \
  'http://localhost:3001/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1555529669-2269763671c0%3Ffm%3Djpg%26q%3D80%26w%3D1200%26auto%3Dformat%26fit%3Dcrop&w=360&q=75'

# Bundle sizes after a build
npm run build && node -e '
const fs=require("fs"),path=require("path"),zlib=require("zlib");
function walk(d,o=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):p.endsWith(".html")&&o.push(p);}return o;}
for(const h of walk(".next/server/app")){const s=fs.readFileSync(h,"utf8");const src=new Set([...s.matchAll(/\/_next\/static\/chunks\/[^"\s]+\.js/g)].map(m=>m[0]));let raw=0,gz=0;for(const u of src){const b=fs.readFileSync(".next"+u.replace("/_next",""));raw+=b.length;gz+=zlib.gzipSync(b).length;}console.log((raw/1024).toFixed(0)+" kB raw / "+(gz/1024).toFixed(0)+" kB gz  "+h.replace(".next/server/app","").replace(/\.html$/,""));}'
```

Lighthouse (Chrome → DevTools → Lighthouse → Mobile, "Navigation", Performance + SEO +
Accessibility + Best practices) should be run against `npm run build && npm start` (port
3000), not the dev server: dev bundles are unminified and include the HMR client. Expect the
SEO audit to be 100 (title, description, canonical, robots.txt valid, crawlable links,
structured data present) and Best Practices to pass the CSP/HTTPS/header checks. Use the
`web-perf` skill or Chrome's Performance panel for LCP/INP/CLS traces if a regression is
suspected; the LCP element on `/` is the first hero image (priority, AVIF, 100vw sizes).
