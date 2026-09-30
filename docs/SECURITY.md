# Security — Milestone 4 hardening

Scope: what was implemented for PRD §9 in this milestone, how it is verified, and what is
still owed before a real production launch. Everything below was measured against the dev
server (`http://localhost:3001`) on 2026-09-23.

## 1. Response headers (`next.config.ts` → `headers()`)

Applied to every route (`source: '/(.*)'`):

| Header | Value | Why |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for two years once the site has been visited over HTTPS. Browsers ignore it over plain `http://` (dev), so it is harmless locally. |
| `X-Content-Type-Options` | `nosniff` | Stops MIME sniffing of scripts/styles. |
| `X-Frame-Options` | `DENY` | Legacy clickjacking guard (the CSP `frame-ancestors 'none'` is the modern equivalent, both are sent). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Full URL only to same-origin, origin only cross-origin over HTTPS. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` | Opts out of powerful features the storefront never uses. |
| `Content-Security-Policy` | see below | XSS / injection blast-radius reduction. |
| `X-Powered-By` | removed (`poweredByHeader: false`) | Do not advertise the framework. |

`X-Robots-Tag: noindex, nofollow` is also sent for `/admin*`, `/api/*`, `/cart`, `/checkout*`,
`/account*`, `/wishlist`, `/login`, `/register`, `/forgot-password`, `/reset-password`, so those
pages stay out of search indexes even where the page component is a client component that
cannot export `metadata`.

### Content-Security-Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' ['unsafe-eval' — development only];
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://images.unsplash.com;
font-src 'self' data:;
connect-src 'self' [ws: wss: — development only];
worker-src 'self' blob:; manifest-src 'self'; media-src 'self';
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
upgrade-insecure-requests [production only]
```

Design notes:

- `'unsafe-inline'` for `script-src` is required by the App Router: React's streamed payload
  is delivered in inline `<script>` tags. Removing it needs per-request nonces, which in
  Next 16 means a `src/proxy.ts` (the file formerly called `middleware.ts` — confirmed in
  `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`) plus fully dynamic
  rendering of every page. That trade-off (no static pages, no CDN HTML caching) was judged
  not worth it for this milestone; it is the first follow-up if a stricter CSP is required.
- `'unsafe-inline'` for `style-src` covers `next/font` and Tailwind's inline style tags.
- `'unsafe-eval'` and `ws:`/`wss:` are only emitted when `NODE_ENV === 'development'`
  (React error overlay, Turbopack HMR socket). They are absent from the production build.
- `img-src` is limited to the one image CDN the catalog store already validates against.
- No external scripts, fonts (next/font self-hosts Figtree) or iframes are allowed.

**Verified** (`curl -I http://localhost:3001/`): all headers present; the page HTML still
renders, `next/font` woff2 loads (`200 font/woff2`), and `/_next/image?...` returns
`200 image/avif`.

## 2. API hardening (`src/lib/rateLimit.ts` + `src/app/api/**/route.ts`)

### Rate limiting

- In-memory **sliding window, 60 requests / 60 s per client IP**, keyed by the first hop of
  `x-forwarded-for` (fallback `x-real-ip`, then a shared `unknown` bucket).
- Over budget → `429 Too Many Requests` JSON with `Retry-After`, `RateLimit-Limit`,
  `RateLimit-Remaining`, `RateLimit-Reset` and `Cache-Control: no-store`. Allowed responses
  carry the same `RateLimit-*` headers so clients can back off early.
- The bucket map is parked on `globalThis` so dev HMR reloads do not reset it, and idle
  buckets are swept once the map passes 5 000 keys.
- **Best-effort, per instance.** Serverless/multi-instance deployments keep one counter per
  instance, and `x-forwarded-for` is only trustworthy behind a proxy that overwrites it
  (Vercel, Cloudflare, nginx). For a global guarantee move the store to Redis/Upstash or use
  the platform WAF; the helper's `checkRateLimit(key)` is the single swap point.

Measured:

```
$ for i in $(seq 1 70); do curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/api/products; done | sort | uniq -c
  53 200
  17 429            # 7 requests had already been spent in the same minute by earlier checks
$ curl -sI http://localhost:3001/api/products | grep -iE 'retry-after|ratelimit'
ratelimit-limit: 60
ratelimit-remaining: 0
ratelimit-reset: 22
retry-after: 22
$ curl -s -o /dev/null -w '%{http_code}\n' -H 'x-forwarded-for: 203.0.113.9' http://localhost:3001/api/products
200               # separate IP = separate bucket
```

### Input validation

- `/api/products` — query is parsed by the existing `parseProductQuery` (page ≥ 1, pageSize ≤ 48,
  list values ≤ 20, search ≤ 100 chars, unknown sort → default). Query strings longer than
  2 048 bytes are rejected with `400` before parsing.
- `/api/products/[slug]` and `/api/products/[slug]/related` — the slug must match
  `^[a-z0-9]+(?:-[a-z0-9]+)*$` and be ≤ 120 chars; anything else is a `404` JSON without
  touching the data layer. Unknown-but-valid slugs are `404` too (related used to return an
  empty `200`).
- Error responses are `Cache-Control: no-store`; nothing from the request is echoed back.

### Cache headers

Successful GETs send `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`, so a
CDN absorbs repeated reads (and rate limiting only applies to origin hits).

## 3. Secrets and configuration

- `.env.example` documents `NEXT_PUBLIC_SITE_URL` (public) and server-only placeholders
  `PAYMENT_GATEWAY_KEY`, `PAYMENT_GATEWAY_SECRET`, `EMAIL_API_KEY`. Only `NEXT_PUBLIC_*`
  values are ever inlined into the browser bundle; `.env*.local` is git-ignored.
- Card data: the test gateway never persists PAN/CVC (see M3 contract); the CSP
  `connect-src 'self'` also prevents any script from posting form data elsewhere.
- JSON-LD is serialised with `serializeJsonLd`, which escapes `<`, `>`, `&`, U+2028 and
  U+2029 so catalog copy can never break out of the `<script type="application/ld+json">`.

## 4. Already in place from M2/M3 (unchanged)

Password hashing with per-user salt, `RequireAdmin` route guard + role check for `/admin`,
client-side field validation for every form, coupon/stock checks at checkout, safe redirect
parsing (`src/lib/safeRedirect.ts`), test-mode gateway with no card storage.

## 5. How to verify

```bash
# Headers on any page
curl -I http://localhost:3001/ | grep -iE 'strict-transport|x-content-type|x-frame|referrer|permissions|content-security'
curl -I http://localhost:3001/cart | grep -i x-robots-tag

# Page, font and image still work under the CSP
curl -s http://localhost:3001/ | grep -o '/_next/static/media/[^"]*\.woff2' | head -1 | xargs -I{} curl -sI 'http://localhost:3001{}' | head -1
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' -H 'Accept: image/avif,image/webp' \
  'http://localhost:3001/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1555529669-2269763671c0%3Ffm%3Djpg%26q%3D80%26w%3D1200%26auto%3Dformat%26fit%3Dcrop&w=360&q=75'

# Rate limit (expect a mix of 200 and 429 after the 60th request in a minute)
for i in $(seq 1 70); do curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/api/products; done | sort | uniq -c

# Input validation
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:3001/api/products/BAD%20slug'   # 404
curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3001/api/products?q=$(head -c 3000 /dev/zero | tr '\0' a)"  # 400

# Browser check: open DevTools → Console on / and /products/<slug>; there must be no
# "Refused to load/execute" CSP violations. (Do this in prod build too: npm run build && npm start.)
```

## 6. Open items for production

1. Nonce-based CSP via `src/proxy.ts` if `'unsafe-inline'` scripts are unacceptable.
2. Shared rate-limit store (Redis/Upstash) or platform WAF rules.
3. Server-side sessions/JWT + authenticated API routes once the localStorage demo layer is
   replaced by a real backend (PRD 9 "authenticated APIs" cannot be met without a server-side
   user store).
4. Dependency audit in CI (`npm audit --production`) and Dependabot.
