# Couture — Deployment guide

The app is a standard Next.js 16 project with no database, so it deploys to Vercel with zero configuration. This guide covers the first deploy, environment variables, custom domains, the pre- and post-deploy checks, rollback, and what changes when real payments and email are connected.

## 1. Before you deploy

```bash
npm run verify     # eslint + tsc --noEmit + next build — must be clean
npm run smoke      # against a local server (BASE_URL defaults to http://localhost:3001)
```

Commit only when `verify` passes. `vercel.json` contains just `{ "framework": "nextjs" }`: no custom build command, output directory or rewrites are needed.

## 2. First deploy on Vercel

1. Push the repository to GitHub / GitLab / Bitbucket.
2. In Vercel: **Add New → Project → Import** the repository.
3. Framework preset: **Next.js** (detected automatically). Root directory: repository root. Build command `next build`, output `.next`, install `npm install` — all defaults. Node.js 20 or later (project default).
4. **Environment variables** (Settings → Environment Variables, or in the import dialog). The full list with comments is in `.env.example`:

   | Variable | Scope | Required | Purpose |
   |---|---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | Production, Preview | Yes in production | Canonical origin (`https://www.example.com`, no trailing slash) used for canonical/Open Graph URLs, `robots.txt`, `sitemap.xml` and JSON-LD. Falls back to `http://localhost:3000` |
   | `PAYMENT_GATEWAY_KEY`, `PAYMENT_GATEWAY_SECRET` | Production | Not yet | Reserved for the real payment provider (section 7). Server-only: never prefix with `NEXT_PUBLIC_` |
   | `EMAIL_API_KEY` | Production | Not yet | Reserved for the transactional email provider (section 8) |

   For Preview deployments you can leave `NEXT_PUBLIC_SITE_URL` unset (Vercel's preview URL is fine for testing) or set it to the preview domain.
5. **Deploy.** The first build takes about a minute. Vercel gives you `https://<project>.vercel.app`.

Every push to the production branch (`main`) redeploys production; every other branch or pull request gets a preview URL.

## 3. Custom domain

1. Project → **Settings → Domains → Add** `www.example.com` (and the apex `example.com`, redirected to `www` or vice versa).
2. Follow the DNS instructions Vercel shows: a `CNAME` for `www` to `cname.vercel-dns.com`, an `A` record for the apex to Vercel's IP, or move nameservers to Vercel.
3. TLS certificates are issued automatically once DNS resolves.
4. Set `NEXT_PUBLIC_SITE_URL=https://www.example.com` in the Production environment and **redeploy** (the variable is inlined at build time).

## 4. Post-deploy checks

```bash
BASE_URL=https://www.example.com npm run smoke
```

The smoke script requests every storefront, account, admin, API and SEO route and prints a pass/fail table with status codes and response times; it exits non-zero when anything fails. Then check by hand:

- `/` renders with images (Unsplash is the only allowed image host in `next.config.ts`).
- `/robots.txt` and `/sitemap.xml` show your production domain.
- Sign in at `/admin/login` with `admin@couture.test / Admin@12345`; the dashboard seeds demo activity.
- Place a test order with card `4242 4242 4242 4242` and confirm it appears under `/account/orders` and `/admin/orders`.
- View-source of a product page contains the `<title>`, Open Graph tags and JSON-LD.

Remember that data is per browser: what you create in one browser is not visible in another (see HANDOVER.md).

## 5. Rollback

Vercel keeps every deployment. **Deployments → (previous good deployment) → ⋯ → Promote to Production** restores it instantly without a rebuild; or `git revert` the offending commit and push. Because there is no database, no data migration is involved in a rollback.

## 6. Operational notes

- **Caching:** storefront pages are dynamic (they read `searchParams`) and rendered per request; static assets and `next/image` output are cached on Vercel's CDN.
- **Rate limiting:** the JSON API under `/api/*` applies an in-memory sliding-window limit (60 requests / minute / IP per instance, `src/lib/rateLimit.ts`). Serverless instances do not share state, so for real traffic add a Vercel WAF rule or an Upstash/Redis store.
- **Errors:** `src/app/error.tsx` and `src/app/admin/error.tsx` catch render errors with a themed "Try again" screen. There is no error reporting service; add Sentry (or Vercel's runtime logs) when a backend exists.
- **Security headers / secrets:** see SECURITY.md when present. Secrets belong in Vercel environment variables, never in the repository.

## 7. Connecting a real payment provider

The checkout never talks to a provider directly; it calls `payAndPlaceOrder` (`src/lib/services/orders.ts`), which uses `activeGateway` from `src/lib/payments/gateway.ts`:

```ts
interface PaymentGateway {
  id: string;
  label: string;
  initiate(input: InitiatePaymentInput): Promise<PaymentIntent>;
  confirm(intentId: string, method: PaymentMethodDetails): Promise<PaymentResult>;
  cancel(intentId: string): Promise<PaymentResult>;
}
```

The shipped `testGateway` simulates Stripe/Razorpay outcomes in the browser. To go live:

1. **Server route for intents.** Create `src/app/api/payments/intents/route.ts`. It re-computes the amount from the bag on the server and creates the provider object with the **secret** key from `process.env` (`stripe.paymentIntents.create` or `razorpay.orders.create`). Return `{ id, clientSecret }` mapped onto `PaymentIntent`.
2. **Confirm through the provider's hosted UI** (Stripe Elements `confirmPayment`, Razorpay Checkout) using only the publishable key (`NEXT_PUBLIC_…`). Card data goes from the provider's iframe straight to the provider — this code base never sees a PAN, expiry or CVC, and `PaymentRecord` stores only brand + last 4.
3. **Verify server-side before marking PAID.** Handle the provider webhook (`payment_intent.succeeded` with the webhook secret, or Razorpay's HMAC signature) in `src/app/api/payments/webhook/route.ts`; only then move the order to CONFIRMED / PAID.
4. **Cancel and refund** map to `paymentIntents.cancel` / `refunds.create` (Stripe) or `payments.refund` (Razorpay) from server routes called by `cancelOrder` / `refundOrder`.
5. Implement the interface as, for example, `stripeGateway`, and point `activeGateway` at it (environment-driven so previews keep the test gateway).

Remove the test hints (`TEST_PAYMENT_HINTS`) from the payment step UI when the live gateway is active.

## 8. Connecting transactional email

`src/lib/services/notifications.ts` records every event (registration, order confirmation, payment, status updates, shipping, delivery, cancellation, refund) as an in-app notification **and** as an outbox email with a rendered subject and plain-text body. Delivery goes through the active `EmailTransport`:

```ts
interface EmailTransport { id: string; send(email: OutboundEmail): Promise<void> }
setEmailTransport(transport);
```

1. Create `src/app/api/email/route.ts` that reads `EMAIL_API_KEY` from `process.env` and calls the provider (Resend, SendGrid, SES, Postmark). Validate the payload and require an authenticated caller.
2. Implement a transport whose `send` posts to that route, and register it with `setEmailTransport` at app start (`src/app/providers.tsx`).
3. A transport that throws leaves the message **Queued** in the outbox; `drainOutbox()` retries. In production move the drain to the server (queue or cron) so delivery does not depend on a browser being open.
4. Configure SPF / DKIM / DMARC for the sending domain before going live.

## 9. Going beyond the demo data layer

Real accounts, orders and inventory need a database and authenticated API routes. HANDOVER.md, section 7, lists the order in which to replace the `src/lib/services/*` modules (each maps to a small set of endpoints) without touching the UI.
