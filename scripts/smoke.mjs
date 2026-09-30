#!/usr/bin/env node
// Smoke test: requests every public + admin route and prints a pass/fail table.
// Dependency-free (Node 18+ global fetch). Usage:
//   BASE_URL=https://couture.example.com node scripts/smoke.mjs
//   npm run smoke            (defaults to http://localhost:3001)
// Exit code 1 when any route fails, so it can gate a deploy.

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 20000);
const SLOW_MS = Number(process.env.SMOKE_SLOW_MS || 5000);

// [path, expected status(es), note]. Admin pages are client-guarded (RequireAdmin), so the
// server always answers 200 and the sign-in redirect happens in the browser.
const ROUTES = [
  ['/', 200, 'home'],
  ['/products', 200, 'catalog'],
  ['/products?q=headphones&sort=price_asc', 200, 'search + sort'],
  ['/products?category=electronics&inStock=true', 200, 'filters'],
  ['/products/aurora-wireless-headphones', 200, 'product detail'],
  ['/products/does-not-exist', 200, 'unknown product (client-resolved, not-found panel)'],
  ['/categories/electronics', 200, 'category page'],
  ['/cart', 200, 'bag'],
  ['/wishlist', 200, 'wishlist'],
  ['/checkout', 200, 'checkout'],
  ['/checkout/success', 200, 'order confirmation'],
  ['/login', 200, 'login'],
  ['/register', 200, 'register'],
  ['/forgot-password', 200, 'forgot password'],
  ['/reset-password', 200, 'reset password'],
  ['/account', 200, 'account overview'],
  ['/account/profile', 200, 'profile'],
  ['/account/addresses', 200, 'addresses'],
  ['/account/orders', 200, 'order history'],
  ['/account/orders/CTR-00000000', 200, 'order detail (unknown number)'],
  ['/account/notifications', 200, 'notifications'],
  ['/track', 200, 'order tracking'],
  ['/admin/login', 200, 'admin sign-in'],
  ['/admin', 200, 'admin dashboard'],
  ['/admin/analytics', 200, 'admin analytics'],
  ['/admin/products', 200, 'admin products'],
  ['/admin/products/new', 200, 'admin new product'],
  ['/admin/categories', 200, 'admin categories'],
  ['/admin/inventory', 200, 'admin inventory'],
  ['/admin/orders', 200, 'admin orders'],
  ['/admin/payments', 200, 'admin payments'],
  ['/admin/coupons', 200, 'admin coupons'],
  ['/admin/customers', 200, 'admin customers'],
  ['/admin/reviews', 200, 'admin reviews'],
  ['/admin/notifications', 200, 'admin notification outbox'],
  ['/robots.txt', 200, 'robots'],
  ['/manifest.webmanifest', 200, 'web manifest'],
  ['/opengraph-image', 200, 'Open Graph image'],
  ['/sitemap.xml', 200, 'sitemap'],
  ['/api/products?pageSize=1', 200, 'JSON products API'],
  ['/api/categories', 200, 'JSON categories API'],
  ['/this-page-does-not-exist', 404, 'not-found page'],
];

async function probe(path, expected) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch(BASE_URL + path, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'couture-smoke/1.0', accept: 'text/html,application/json' },
    });
    const body = await res.text();
    const ms = Math.round(performance.now() - started);
    const okStatus = [].concat(expected).includes(res.status);
    const looksBroken = /Application error|Internal Server Error|__next_error__/i.test(body);
    return { status: res.status, ms, ok: okStatus && !looksBroken, detail: looksBroken ? 'error page body' : ms > SLOW_MS ? 'slow' : '' };
  } catch (err) {
    return { status: 0, ms: Math.round(performance.now() - started), ok: false, detail: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

function pad(value, width, right = false) {
  const s = String(value);
  return right ? s.padStart(width) : s.padEnd(width);
}

const results = [];
for (const [path, expected, note] of ROUTES) {
  const r = await probe(path, expected);
  results.push({ path, expected, note, ...r });
}

const pathWidth = Math.max(...results.map((r) => r.path.length), 4);
const noteWidth = Math.max(...results.map((r) => r.note.length), 4);
const line = `| ${pad('Route', pathWidth)} | ${pad('Status', 6)} | ${pad('Time', 7, true)} | ${pad('Result', 6)} | ${pad('Note', noteWidth)} |`;
console.log(`Smoke test against ${BASE_URL}\n`);
console.log(line);
console.log(`|${'-'.repeat(pathWidth + 2)}|--------|---------|--------|${'-'.repeat(noteWidth + 2)}|`);
for (const r of results) {
  const status = r.status || 'ERR';
  const note = r.detail ? `${r.note} (${r.detail})` : r.note;
  console.log(`| ${pad(r.path, pathWidth)} | ${pad(status, 6)} | ${pad(`${r.ms} ms`, 7, true)} | ${pad(r.ok ? 'PASS' : 'FAIL', 6)} | ${pad(note, noteWidth)} |`);
}

const failed = results.filter((r) => !r.ok);
const avg = Math.round(results.reduce((sum, r) => sum + r.ms, 0) / results.length);
console.log(`\n${results.length - failed.length}/${results.length} passed · average ${avg} ms · slowest ${Math.max(...results.map((r) => r.ms))} ms`);
if (failed.length) {
  console.error(`\n${failed.length} route(s) failed: ${failed.map((r) => r.path).join(', ')}`);
  process.exit(1);
}
